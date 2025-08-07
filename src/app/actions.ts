

"use server";

import {
  suggestRescheduleOptions,
  type SuggestRescheduleOptionsInput,
} from "@/ai/flows/suggest-reschedule-options";
import { db } from "@/lib/firebase/firebase";
import { getDocument, getOrCreateChat as getOrCreateChatFirestore, UserProfile, Appointment, updateAverageRating, WalletTransaction } from "@/lib/firebase/firestore";
import { addDoc, collection, doc, getDoc, increment, serverTimestamp, setDoc, updateDoc, writeBatch, runTransaction, query, where, getDocs, orderBy } from "firebase/firestore";
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

const editAppointmentFormSchema = appointmentFormSchema.extend({
    appointmentId: z.string().min(1),
});

export async function updateAppointment(values: z.infer<typeof editAppointmentFormSchema>) {
    const validatedFields = editAppointmentFormSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields: " + validatedFields.error.errors.map(e => e.message).join(', '),
        };
    }

    const { appointmentId, customerId, barberId, ...rest } = validatedFields.data;
    
    const customerDoc = await getDocument("users", customerId);
    const barberDoc = await getDocument("users", barberId);

    if (!customerDoc || !barberDoc) {
        return { error: "Invalid customer or barber selected." };
    }
    
    try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        await updateDoc(appointmentRef, {
            ...rest,
            customerId,
            barberId,
            customerName: customerDoc.displayName,
            customerPhotoURL: customerDoc.photoURL,
            barberName: barberDoc.displayName,
            barberPhotoURL: barberDoc.photoURL,
        });
        
        revalidatePath('/appointments');
        return { success: "Appointment updated successfully!" };
    } catch (error) {
        console.error("Firestore Error:", error);
        return { error: "Failed to update appointment." };
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


const updateUserAccountStatusSchema = z.object({
    userId: z.string().min(1),
    status: z.enum(['Pending', 'Approved', 'Rejected']),
});

export async function updateUserAccountStatus(values: z.infer<typeof updateUserAccountStatusSchema>) {
    const validatedFields = updateUserAccountStatusSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields: " + validatedFields.error.errors.map(e => e.message).join(', '),
        };
    }
    
    const { userId, status } = validatedFields.data;

    try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { accountStatus: status });
        
        revalidatePath('/user-management');
        return { success: `User account has been ${status}.` };

    } catch (error) {
        console.error("Firestore Error:", error);
        return { error: "Failed to update user account status." };
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
  reviewText: z.string().optional(),
});

export async function rateAppointment(values: z.infer<typeof rateAppointmentSchema>) {
    const validatedFields = rateAppointmentSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields: " + validatedFields.error.errors.map(e => e.message).join(', '),
        };
    }
    const { appointmentId, ratedUserId, rating, ratingField, reviewText } = validatedFields.data;

    try {
        const appointmentRef = doc(db, "appointments", appointmentId);
        
        const updateData: { [key: string]: any } = { [ratingField]: rating };
        if (reviewText) {
            updateData.reviewText = reviewText;
        }
        
        await updateDoc(appointmentRef, updateData);
        await updateAverageRating(ratedUserId);

        revalidatePath('/appointments');
        revalidatePath(`/barbers/${ratedUserId}`);
        return { success: "Rating submitted successfully!" };

    } catch (error) {
        console.error("Firestore Error:", error);
        return { error: "Failed to submit rating." };
    }
}

// Wallet Actions
const topUpWalletSchema = z.object({
  userId: z.string().min(1),
  coinsToConvert: z.number().int().positive(),
});

export async function topUpWalletFromCoins(values: z.infer<typeof topUpWalletSchema>) {
  const validatedFields = topUpWalletSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Invalid input: " + validatedFields.error.errors.map((e) => e.message).join(" ") };
  }
  
  const { userId, coinsToConvert } = validatedFields.data;
  const userRef = doc(db, "users", userId);
  
  try {
    const pkrAmount = (coinsToConvert / 1000) * 5;
    
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("User not found.");
      
      const currentCoins = userDoc.data().coins || 0;
      if (currentCoins < coinsToConvert) {
        throw new Error("Insufficient coins.");
      }
      
      transaction.update(userRef, {
        coins: increment(-coinsToConvert),
        walletBalance: increment(pkrAmount),
      });

      const walletTxRef = doc(collection(db, "users", userId, "walletTransactions"));
      transaction.set(walletTxRef, {
        amount: pkrAmount,
        type: "Top-up",
        description: `Converted ${coinsToConvert} coins`,
        timestamp: serverTimestamp()
      });
    });
    
    revalidatePath('/wallet');
    revalidatePath('/');
    return { success: `Successfully converted ${coinsToConvert} coins to PKR ${pkrAmount.toFixed(2)}!` };
  } catch (error: any) {
    console.error("Top-up Error:", error);
    return { error: error.message || "Failed to top up wallet." };
  }
}

const payFromWalletSchema = z.object({
    appointmentId: z.string().min(1),
});

export async function payFromWallet(values: z.infer<typeof payFromWalletSchema>) {
    const { appointmentId } = values;
    
    try {
        await runTransaction(db, async (transaction) => {
            const appointmentRef = doc(db, "appointments", appointmentId);
            const appointmentDoc = await transaction.get(appointmentRef);

            if (!appointmentDoc.exists()) throw new Error("Appointment not found.");
            const appointment = appointmentDoc.data() as Appointment;
            if (appointment.status !== 'Completed') throw new Error("Appointment is not completed yet.");
            if (appointment.paymentStatus === 'Paid') throw new Error("Appointment has already been paid for.");

            const price = appointment.price || 0;
            const customerRef = doc(db, "users", appointment.customerId);
            const barberRef = doc(db, "users", appointment.barberId);

            const customerDoc = await transaction.get(customerRef);
            if (!customerDoc.exists()) throw new Error("Customer not found.");
            const customerWalletBalance = customerDoc.data().walletBalance || 0;

            if (customerWalletBalance < price) throw new Error("Insufficient wallet balance.");
            
            // 1. Debit customer wallet
            transaction.update(customerRef, { walletBalance: increment(-price) });
            const customerTxRef = doc(collection(db, "users", appointment.customerId, "walletTransactions"));
            transaction.set(customerTxRef, {
                amount: price,
                type: "Payment Sent",
                description: `Payment for service: ${appointment.service} to ${appointment.barberName}`,
                timestamp: serverTimestamp()
            });
            
            // 2. Credit barber wallet
            transaction.update(barberRef, { walletBalance: increment(price) });
            const barberTxRef = doc(collection(db, "users", appointment.barberId, "walletTransactions"));
            transaction.set(barberTxRef, {
                amount: price,
                type: "Payment Received",
                description: `Payment for service: ${appointment.service} from ${appointment.customerName}`,
                timestamp: serverTimestamp()
            });

            // 3. Update appointment
            transaction.update(appointmentRef, {
                paymentStatus: 'Paid',
                amountPaid: price
            });
            
            // 4. Award coins
            const customerCoins = Math.floor(price / 100) * 100;
            const barberCoins = Math.floor(price / 100) * 50;
            transaction.update(customerRef, { coins: increment(customerCoins) });
            transaction.update(barberRef, { coins: increment(barberCoins) });
        });

        revalidatePath('/appointments');
        revalidatePath('/billing');
        revalidatePath('/wallet');
        revalidatePath('/');
        return { success: "Payment successful!" };
    } catch (error: any) {
        console.error("Payment Error:", error);
        return { error: error.message || "Failed to process payment." };
    }
}


export async function getWalletTransactions(userId: string): Promise<{ success: boolean; data?: WalletTransaction[]; error?: string }> {
  try {
    const q = query(
      collection(db, "users", userId, "walletTransactions"),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString()
        } as WalletTransaction
    });
    return { success: true, data: transactions };
  } catch (error: any) {
    console.error("Error fetching wallet transactions:", error);
    return { success: false, error: "Could not fetch transaction history." };
  }
}
