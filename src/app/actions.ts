
"use server";

import {
  suggestRescheduleOptions,
  type SuggestRescheduleOptionsInput,
} from "@/ai/flows/suggest-reschedule-options";
import { db } from "@/lib/firebase/firebase";
import { getDocument, getOrCreateChat as getOrCreateChatFirestore, UserProfile, Appointment, updateAverageRating } from "@/lib/firebase/firestore";
import { addDoc, collection, doc, getDoc, increment, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const rescheduleFormSchema = z.object({
  customerPreferences: z
    .string()
    .min(10, "Please describe customer preferences in a bit more detail.")
    .max(500),
  barberAvailability: z
    .string()
    .min(10, "Please describe barber availability in a bit more detail.")
    .max(500),
  currentAppointmentDateTime: z
    .string()
    .min(1, "Please enter the current appointment date and time."),
  appointmentDuration: z.coerce
    .number({ invalid_type_error: "Please enter a number." })
    .min(1, "Duration must be at least 1 minute."),
});

export async function getRescheduleSuggestions(
  values: SuggestRescheduleOptionsInput
) {
  const validatedFields = rescheduleFormSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error:
        "Invalid input. " +
        validatedFields.error.errors.map((e) => e.message).join(" "),
    };
  }

  try {
    const result = await suggestRescheduleOptions(validatedFields.data);
    return { data: result };
  } catch (e) {
    console.error("AI Error:", e);
    return { error: "Failed to get suggestions from the AI. Please try again." };
  }
}


const appointmentFormSchema = z.object({
  customerId: z.string().min(1, "Please select a customer."),
  barberId: z.string().min(1, "Please select a barber."),
  service: z.string().min(2, "Service must be at least 2 characters.").max(50),
  dateTime: z.string().min(1, "Please select a date and time."),
  price: z.number().min(0, "Price cannot be negative."),
});

export async function addAppointment(values: z.infer<typeof appointmentFormSchema>) {
    const validatedFields = appointmentFormSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields: " + validatedFields.error.errors.map(e => e.message).join(', '),
        };
    }
    
    const { customerId, barberId, service, dateTime, price } = validatedFields.data;
    
    const customerDoc = await getDocument("users", customerId);
    const barberDoc = await getDocument("users", barberId);

    if (!customerDoc || !barberDoc) {
        return { error: "Invalid customer or barber selected." };
    }

    const customerName = customerDoc.displayName;
    const customerPhotoURL = customerDoc.photoURL;
    const barberName = barberDoc.displayName;
    const barberPhotoURL = barberDoc.photoURL;


    try {
        await addDoc(collection(db, "appointments"), {
            ...validatedFields.data,
            customerName,
            customerPhotoURL,
            barberName,
            barberPhotoURL,
            status: 'Confirmed',
            paymentStatus: 'Unpaid'
        });

        await getOrCreateChat(customerId, barberId);

        revalidatePath('/appointments');
        revalidatePath('/'); // For dashboard
        revalidatePath('/chat');
        revalidatePath('/billing');
        return { success: "Appointment created successfully!" };
    } catch (error) {
        console.error("Firestore Error:", error);
        return { error: "Failed to create appointment." };
    }
}

export async function getOrCreateChat(userId1: string, userId2: string) {
  return getOrCreateChatFirestore(userId1, userId2);
}

const updateUserRoleSchema = z.object({
    userId: z.string().min(1),
    role: z.enum(['customer', 'barber', 'admin']),
});

export async function updateUserRole(values: z.infer<typeof updateUserRoleSchema>) {
    const validatedFields = updateUserRoleSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields: " + validatedFields.error.errors.map(e => e.message).join(', '),
        };
    }
    
    const { userId, role } = validatedFields.data;

    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { role });
        
        revalidatePath('/user-management');
        return { success: "User role updated successfully!" };

    } catch (error) {
        console.error("Firestore Error:", error);
        return { error: "Failed to update user role." };
    }
}

const updateAppointmentStatusSchema = z.object({
    appointmentId: z.string().min(1),
    status: z.enum(['InProgress', 'Completed']),
});

export async function updateAppointmentStatus(values: z.infer<typeof updateAppointmentStatusSchema>) {
    const validatedFields = updateAppointmentStatusSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields: " + validatedFields.error.errors.map(e => e.message).join(', '),
        };
    }

    try {
        const appointmentRef = doc(db, "appointments", values.appointmentId);
        await updateDoc(appointmentRef, { status: values.status });
        
        revalidatePath('/appointments');
        return { success: `Appointment status updated to ${values.status}!` };

    } catch (error) {
        console.error("Firestore Error:", error);
        return { error: "Failed to update appointment status." };
    }
}

const recordPaymentSchema = z.object({
    appointmentId: z.string().min(1),
    amountPaid: z.coerce.number().min(0, "Amount paid cannot be negative."),
});

export async function recordPayment(values: z.infer<typeof recordPaymentSchema>) {
    const validatedFields = recordPaymentSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields: " + validatedFields.error.errors.map(e => e.message).join(', '),
        };
    }

    try {
        const appointmentRef = doc(db, "appointments", values.appointmentId);
        const appointmentSnap = await getDoc(appointmentRef);

        if (!appointmentSnap.exists()) {
            return { error: "Appointment not found." };
        }
        const appointment = appointmentSnap.data() as Appointment;

        // Update appointment
        await updateDoc(appointmentRef, { 
            amountPaid: values.amountPaid,
            paymentStatus: 'Paid',
            status: 'Completed' // Ensure status is completed
        });

        // Award coins
        const customerRef = doc(db, "users", appointment.customerId);
        const barberRef = doc(db, "users", appointment.barberId);

        // Award 100 coins per 100 PKR for customer, 50 coins per 100 PKR for barber
        const customerCoins = Math.floor(values.amountPaid / 100) * 100;
        const barberCoins = Math.floor(values.amountPaid / 100) * 50;

        await updateDoc(customerRef, { coins: increment(customerCoins) });
        await updateDoc(barberRef, { coins: increment(barberCoins) });
        
        revalidatePath('/appointments');
        revalidatePath('/billing');
        revalidatePath('/'); // For dashboard coin display
        return { success: `Payment of ${values.amountPaid} recorded successfully! ${customerCoins} coins awarded to customer, ${barberCoins} to barber.` };

    } catch (error) {
        console.error("Firestore Error:", error);
        return { error: "Failed to record payment." };
    }
}


const rateAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
  ratedUserId: z.string().min(1),
  rating: z.number().min(1).max(5),
  ratingField: z.enum(['barberRating', 'customerRating']),
});

export async function rateAppointment(values: z.infer<typeof rateAppointmentSchema>) {
    const validatedFields = rateAppointmentSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields: " + validatedFields.error.errors.map(e => e.message).join(', '),
        };
    }
    const { appointmentId, ratedUserId, rating, ratingField } = validatedFields.data;

    try {
        // Update the rating in the appointment document
        const appointmentRef = doc(db, "appointments", appointmentId);
        await updateDoc(appointmentRef, { [ratingField]: rating });

        // Update the average rating for the user
        await updateAverageRating(ratedUserId);

        revalidatePath('/appointments');
        return { success: "Rating submitted successfully!" };

    } catch (error) {
        console.error("Firestore Error:", error);
        return { error: "Failed to submit rating." };
    }
}
