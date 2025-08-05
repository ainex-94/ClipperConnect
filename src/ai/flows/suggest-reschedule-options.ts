'use server';

/**
 * @fileOverview An AI agent that suggests alternative reschedule options for appointments.
 *
 * - suggestRescheduleOptions - A function that suggests alternative time slots for rescheduling an appointment.
 * - SuggestRescheduleOptionsInput - The input type for the suggestRescheduleOptions function.
 * - SuggestRescheduleOptionsOutput - The return type for the suggestRescheduleOptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRescheduleOptionsInputSchema = z.object({
  customerPreferences: z
    .string()
    .describe('The customer\'s preferences for rescheduling the appointment, including preferred days and times.'),
  barberAvailability: z
    .string()
    .describe('The barber\'s availability, including working hours and off days.'),
  currentAppointmentDateTime: z
    .string()
    .describe('The date and time of the appointment that the customer wants to reschedule.'),
  appointmentDuration: z
    .number()
    .describe('The duration of the appointment in minutes.'),
});
export type SuggestRescheduleOptionsInput = z.infer<
  typeof SuggestRescheduleOptionsInputSchema
>;

const SuggestRescheduleOptionsOutputSchema = z.object({
  suggestedTimeSlots: z
    .array(z.string())
    .describe('An array of suggested alternative time slots for rescheduling the appointment, formatted as ISO date strings.'),
  reasoning: z
    .string()
    .describe('The AI\s reasoning for suggesting these time slots.'),
});
export type SuggestRescheduleOptionsOutput = z.infer<
  typeof SuggestRescheduleOptionsOutputSchema
>;

export async function suggestRescheduleOptions(
  input: SuggestRescheduleOptionsInput
): Promise<SuggestRescheduleOptionsOutput> {
  return suggestRescheduleOptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRescheduleOptionsPrompt',
  input: {schema: SuggestRescheduleOptionsInputSchema},
  output: {schema: SuggestRescheduleOptionsOutputSchema},
  prompt: `You are an AI assistant helping customers reschedule appointments with their barber.

  Given the customer's preferences, the barber's availability, the current appointment details, and the appointment duration, suggest 3 alternative time slots for rescheduling.
  Consider the customer's preferences and the barber's availability to minimize disruption.

  Customer Preferences: {{{customerPreferences}}}
  Barber Availability: {{{barberAvailability}}}
  Current Appointment Date/Time: {{{currentAppointmentDateTime}}}
  Appointment Duration (minutes): {{{appointmentDuration}}}

  Format the suggested time slots as ISO date strings.
  Explain your reasoning for choosing these time slots.
  `,
});

const suggestRescheduleOptionsFlow = ai.defineFlow(
  {
    name: 'suggestRescheduleOptionsFlow',
    inputSchema: SuggestRescheduleOptionsInputSchema,
    outputSchema: SuggestRescheduleOptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
