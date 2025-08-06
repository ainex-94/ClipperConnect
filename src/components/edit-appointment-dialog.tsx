
// src/components/edit-appointment-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateAppointment } from "@/app/actions";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Loader2, Pencil } from "lucide-react";
import { getCustomers, getBarbers, UserProfile, Appointment } from "@/lib/firebase/firestore";
import { useNotification } from "@/hooks/use-notification";

const formSchema = z.object({
  appointmentId: z.string(),
  customerId: z.string().min(1, "Please select a customer."),
  barberId: z.string().min(1, "Please select a barber."),
  service: z.string().min(1, "Please select a service."),
  dateTime: z.string().min(1, "Please select a date and time."),
  price: z.number(),
});

interface User {
  id: string;
  displayName: string;
}

const services = [
  { name: "Haircut", price: 1500 },
  { name: "Beard Trim", price: 800 },
  { name: "Haircut & Beard Trim", price: 2200 },
  { name: "Shave", price: 1000 },
  { name: "Kids Haircut", price: 1200 },
  { name: "Fade", price: 1800 },
  { name: "Hair Coloring", price: 3500 },
];

interface EditAppointmentDialogProps {
    appointment: Appointment;
    onSuccess: () => void;
}

export function EditAppointmentDialog({ appointment, onSuccess }: EditAppointmentDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<User[]>([]);
  const [barbers, setBarbers] = useState<User[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      barberId: appointment.barberId,
      service: appointment.service,
      price: appointment.price,
      dateTime: new Date(appointment.dateTime).toISOString().substring(0, 16),
    },
  });

  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        setIsLoading(true);
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
    const result = await updateAppointment(values);
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
        description: "Appointment has been updated.",
      });
      onSuccess();
      triggerNotification();
      setOpen(false);
    }
  }
  
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Update the details for this appointment.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.name} value={service.name}>
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
             <FormField control={form.control} name="price" render={({ field }) => <Input type="hidden" {...field} />} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
