"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getRescheduleSuggestions } from "@/app/actions";
import type { SuggestRescheduleOptionsOutput } from "@/ai/flows/suggest-reschedule-options";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Wand2, CalendarCheck2 } from "lucide-react";

const formSchema = z.object({
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

export function RescheduleTool() {
  const { toast } = useToast();
  const [result, setResult] = useState<SuggestRescheduleOptionsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerPreferences: "Prefers weekday afternoons, ideally after 2 PM.",
      barberAvailability: "Works 9 AM to 6 PM on weekdays. Off on weekends. Lunch break from 1 PM to 2 PM.",
      currentAppointmentDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16), // Default to 2 days from now
      appointmentDuration: 45,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    const response = await getRescheduleSuggestions(values);

    if (response.error) {
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: response.error,
      });
    } else {
      setResult(response.data);
    }

    setIsLoading(false);
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="currentAppointmentDateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original Appointment</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="appointmentDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 45" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="customerPreferences"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Preferences</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Prefers weekday afternoons..." {...field} />
                </FormControl>
                <FormDescription>
                  Describe the customer's ideal rescheduling times.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="barberAvailability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Barber's Availability</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Works 9-6 on weekdays..." {...field} />
                </FormControl>
                <FormDescription>
                  Include working hours, breaks, and days off.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Find Alternatives
          </Button>
        </form>
      </Form>

      {result && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarCheck2 className="text-primary" />
            Suggested Reschedule Times
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.suggestedTimeSlots.map((slot, index) => (
              <Card key={index} className="bg-background/80">
                <CardContent className="p-4">
                  <p className="font-semibold">{new Date(slot).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  <p className="text-2xl font-bold text-primary">{new Date(slot).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                </CardContent>
              </Card>
            ))}
          </div>
           <Card className="bg-accent/10 border-accent/20">
            <CardHeader>
              <CardTitle className="text-base text-accent-foreground/80">Reasoning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-accent-foreground/70">{result.reasoning}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
