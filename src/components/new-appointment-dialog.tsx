// src/components/new-appointment-dialog.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addAppointment } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Loader2 } from "lucide-react";
import { getCustomers, getBarbers, UserProfile, getServicesForBarber, Service, getAppointmentsForBarberOnDate, Appointment } from "@/lib/firebase/firestore";
import { useNotification } from "@/hooks/use-notification";
import { Combobox } from "./ui/combobox";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, setHours, setMinutes, setSeconds, setMilliseconds, parse, startOfDay } from "date-fns";

const formSchema = z.object({
  customerId: z.string().min(1, "Please select a customer."),
  barberId: z.string().min(1, "Please select a barber."),
  serviceName: z.string().min(1, "Please select a service."),
  dateTime: z.date({ required_error: "Please select a date and time." }),
  price: z.number(),
  duration: z.number(),
});

interface NewAppointmentDialogProps {
  onSuccess?: () => void;
}

export function NewAppointmentDialog({ onSuccess }: NewAppointmentDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerNotificationSound } = useNotification();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [barbers, setBarbers] = useState<UserProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const selectedBarberId = form.watch("barberId");
  const selectedService = services.find(s => s.name === form.watch("serviceName"));
  
  // Fetch services when a barber is selected
  useEffect(() => {
    const fetchAndSetServices = async () => {
      if (selectedBarberId) {
        setIsLoading(true);
        const barberServices = await getServicesForBarber(selectedBarberId);
        setServices(barberServices);
        setIsLoading(false);
      } else {
        setServices([]);
      }
      form.setValue('serviceName', '');
      form.setValue('price', 0);
      form.setValue('duration', 0);
    };
    fetchAndSetServices();
  }, [selectedBarberId, form]);

  // Fetch booked appointments when barber and date change
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (selectedBarberId && selectedDate) {
        setIsLoading(true);
        const appointments = await getAppointmentsForBarberOnDate(selectedBarberId, selectedDate);
        setBookedAppointments(appointments);
        setIsLoading(false);
      }
    };
    fetchBookedSlots();
  }, [selectedBarberId, selectedDate]);
  
  // Generate available slots
  useEffect(() => {
    if (!selectedDate || !selectedService || !selectedBarberId) {
      setAvailableSlots([]);
      return;
    }
  
    const barber = barbers.find(b => b.id === selectedBarberId);
    const dayOfWeek = format(selectedDate, 'eeee').toLowerCase();
    const workingHours = barber?.availability?.[dayOfWeek];
    
    if (!workingHours) {
      setAvailableSlots([]);
      return;
    }

    const serviceDuration = selectedService.duration;
    const slots: Date[] = [];
    const now = new Date();

    const dayStart = parse(workingHours.start, 'HH:mm', selectedDate);
    const dayEnd = parse(workingHours.end, 'HH:mm', selectedDate);

    let currentTime = dayStart;

    while (currentTime < dayEnd) {
      const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);
      
      if (slotEnd > dayEnd) break;

      const isBooked = bookedAppointments.some(appt => {
        const apptStart = new Date(appt.dateTime);
        const apptEnd = new Date(apptStart.getTime() + (appt.duration || 30) * 60000);
        return currentTime < apptEnd && slotEnd > apptStart;
      });

      if (!isBooked && currentTime > now) {
        slots.push(new Date(currentTime));
      }

      currentTime = new Date(currentTime.getTime() + 15 * 60000); // Check every 15 mins for a slot start
    }
    setAvailableSlots(slots);
  }, [bookedAppointments, selectedDate, selectedService, selectedBarberId, barbers]);


  // Reset form when dialog opens
  useEffect(() => {
    if (open && user) {
      form.reset({
        customerId: user.role === 'customer' ? user.uid : '',
        barberId: user.role === 'barber' ? user.uid : '',
        serviceName: '',
      });
      setSelectedDate(new Date());
      setAvailableSlots([]);
    }
  }, [open, user, form]);

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        setIsLoading(true);
        const [customerData, barberData] = await Promise.all([
            getCustomers(),
            getBarbers()
        ]);
        setCustomers(customerData);
        setBarbers(barberData);
        setIsLoading(false);
      };
      fetchUsers();
    }
  }, [open]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await addAppointment({
      ...values,
      dateTime: values.dateTime.toISOString(),
    });
    setIsLoading(false);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      toast({
        title: "Success",
        description: "New appointment has been created.",
      });
      setOpen(false);
      onSuccess?.();
      triggerNotificationSound();
    }
  }
  
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">New Appointment</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details below to book a new slot.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Field */}
              <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={user.role === 'customer' || isLoading}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {user.role === 'customer' ? (
                                <SelectItem value={user.uid}>{user.displayName}</SelectItem>
                            ) : (
                                customers.map((c) => ( <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>))
                            )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
                  )}
              />

              {/* Barber Field */}
               <FormField
                  control={form.control}
                  name="barberId"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Barber</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={user.role === 'barber' || isLoading}>
                          <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a barber" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {user.role === 'barber' ? (
                                <SelectItem value={user.uid}>{user.displayName}</SelectItem>
                            ) : (
                                barbers.map((b) => (<SelectItem key={b.id} value={b.id}>{b.displayName}</SelectItem>))
                            )}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="serviceName"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Service</FormLabel>
                  <Combobox
                    options={services.map(s => ({ value: s.name, label: `${s.name} - ${s.duration} min` }))}
                    value={field.value}
                    onChange={(value) => {
                      const selected = services.find(s => s.name === value);
                      if (selected) {
                        field.onChange(value);
                        form.setValue('price', selected.price);
                        form.setValue('duration', selected.duration);
                      }
                    }}
                    placeholder={!selectedBarberId ? "Select a barber first" : "Select a service"}
                    searchPlaceholder="Search services..."
                    emptyText="No services found."
                    disabled={!selectedBarberId || services.length === 0 || isLoading}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="dateTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant="outline" className="pl-3 text-left font-normal" disabled={!selectedService}>
                                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus disabled={(date) => date < startOfDay(new Date())} />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                    <FormLabel>Available Slots</FormLabel>
                    <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-2">
                      {isLoading && <Loader2 className="animate-spin h-5 w-5" />}
                      {!isLoading && availableSlots.length > 0 ? availableSlots.map(slot => (
                        <Button
                          key={slot.toISOString()}
                          variant={form.getValues("dateTime")?.getTime() === slot.getTime() ? "default" : "outline"}
                          size="sm"
                          onClick={() => form.setValue("dateTime", slot, { shouldValidate: true })}
                        >
                          {format(slot, "p")}
                        </Button>
                      )) : !isLoading && <p className="text-xs text-muted-foreground col-span-3 text-center py-4">No available slots for this day. Please try another date or service.</p>}
                    </div>
                </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Appointment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
