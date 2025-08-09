
// src/components/new-appointment-dialog.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
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
import { getCustomers, getBarbers, UserProfile, getServicesForBarber, Service } from "@/lib/firebase/firestore";
import { useNotification } from "@/hooks/use-notification";

const formSchema = z.object({
  customerId: z.string().min(1, "Please select a customer."),
  barberId: z.string().min(1, "Please select a barber."),
  service: z.string().min(1, "Please select a service."),
  dateTime: z.string().min(1, "Please select a date and time."),
  price: z.number(), // Price will be set programmatically
});

interface User {
  id: string;
  displayName: string;
}

interface NewAppointmentDialogProps {
  onSuccess?: () => void;
}

export function NewAppointmentDialog({ onSuccess }: NewAppointmentDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerNotificationSound } = useNotification();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<User[]>([]);
  const [barbers, setBarbers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString().substring(0, 16), // 1 hour from now
    },
  });

  const selectedBarberId = form.watch("barberId");

  const fetchServices = useCallback(async (barberId: string) => {
    if (!barberId) return;
    setIsLoading(true);
    const barberServices = await getServicesForBarber(barberId);
    setServices(barberServices);
    // Set a default service if available
    if (barberServices.length > 0) {
        form.setValue("service", barberServices[0].name);
        form.setValue("price", barberServices[0].price);
    }
    setIsLoading(false);
  }, [form]);
  
  useEffect(() => {
    if (selectedBarberId) {
      fetchServices(selectedBarberId);
    } else {
      setServices([]);
      form.setValue('service', '');
      form.setValue('price', 0);
    }
  }, [selectedBarberId, fetchServices, form]);


  useEffect(() => {
    // Reset form with role-specific defaults whenever the dialog opens or user changes
    if (open && user) {
      form.reset({
        customerId: user.role === 'customer' ? user.uid : '',
        barberId: user.role === 'barber' ? user.uid : '',
        service: '',
        price: 0,
        dateTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString().substring(0, 16),
      });
    }
  }, [open, user, form]);

  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        setIsLoading(true);
        // Fetch both lists regardless of role for simplicity, then filter UI
        const [customerData, barberData] = await Promise.all([
            getCustomers(),
            getBarbers()
        ]);
        setCustomers(customerData as User[]);
        setBarbers(barberData as User[]);
        setIsLoading(false);
      };
      fetchUsers();
    }
  }, [open]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await addAppointment(values);
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
      form.reset();
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
          <DialogDescription>
            Fill in the details below to book a new slot.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            
            {/* Customer Field Logic */}
            {user.role === 'admin' && (
               <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={isLoading}>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {user.role === 'barber' && (
                <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={isLoading}>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {user.role === 'customer' && (
                <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <FormControl>
                            <Input {...field} value={user.displayName || ''} disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
              />
            )}

            {/* Barber Field Logic */}
            {(user.role === 'admin' || user.role === 'customer') && (
                 <FormField
                    control={form.control}
                    name="barberId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Barber</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger disabled={isLoading}>
                                <SelectValue placeholder="Select a barber" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {barbers.map((barber) => (
                                    <SelectItem key={barber.id} value={barber.id}>
                                    {barber.displayName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            {user.role === 'barber' && (
                 <FormField
                    control={form.control}
                    name="barberId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Barber</FormLabel>
                        <FormControl>
                            <Input {...field} value={user.displayName || ''} disabled />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
              />
            )}
            
            <FormField
              control={form.control}
              name="service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                   <Select 
                      onValueChange={(value) => {
                        const selectedService = services.find(s => s.name === value);
                        if (selectedService) {
                          field.onChange(value);
                          form.setValue('price', selectedService.price);
                        }
                      }} 
                      defaultValue={field.value}
                      disabled={!selectedBarberId || services.length === 0 || isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedBarberId ? "First select a barber" : "Select a service"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.name}>
                            {service.name} - PKR {service.price.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {/* Hidden price field to submit with form */}
             <FormField control={form.control} name="price" render={({ field }) => <Input type="hidden" {...field} />} />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
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
