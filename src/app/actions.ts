"use server";

import {
  suggestRescheduleOptions,
  type SuggestRescheduleOptionsInput,
} from "@/ai/flows/suggest-reschedule-options";
import { db } from "@/lib/firebase/firebase";
import { addDoc, collection } from "firebase/firestore";
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
});

export async function addAppointment(values: z.infer<typeof appointmentFormSchema>) {
    const validatedFields = appointmentFormSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            error: "Invalid fields: " + validatedFields.error.errors.map(e => e.message).join(', '),
        };
    }
    
    // We need to fetch the names based on the IDs.
    // This is a simplified example. In a real app, you might want to denormalize this data
    // or fetch it more efficiently. For this case, we'll just store the IDs and names.
    const { customerId, barberId, service, dateTime } = validatedFields.data;
    
    // This is a placeholder for fetching user names.
    // In a real app, you should fetch this from your database.
    const customerName = "Customer Name"; // Replace with actual lookup
    const barberName = "Barber Name"; // Replace with actual lookup


    try {
        await addDoc(collection(db, "appointments"), {
            ...validatedFields.data,
            // Storing names for easier display, but IDs are the source of truth
            customerName, // You'd fetch this based on customerId
            barberName, // You'd fetch this based on barberId
            status: 'Confirmed'
        });

        revalidatePath('/appointments'); // This tells Next.js to refetch the data on the appointments page
        return { success: "Appointment created successfully!" };
    } catch (error) {
        console.error("Firestore Error:", error);
        return { error: "Failed to create appointment." };
    }
}
