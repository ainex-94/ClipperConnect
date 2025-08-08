
// src/app/appointments/page.tsx
'use client';

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppointmentsForUser, Appointment } from "@/lib/firebase/firestore";
import { MoreHorizontal, Loader2, Star, Pencil, Play, Square, DollarSign, FileText, Wallet } from "lucide-react";
import { format } from 'date-fns';
import { NewAppointmentDialog } from "@/components/new-appointment-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { StartChatButton } from "@/components/start-chat-button";
import { StartEndJobDialog } from "@/components/start-end-job-dialog";
import { EnterPaymentDialog } from "@/components/enter-payment-dialog";
import { RateAppointmentDialog } from "@/components/rate-appointment-dialog";
import { EditAppointmentDialog } from "@/components/edit-appointment-dialog";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { payFromWallet } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/hooks/use-notification";

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { triggerNotificationSound } = useNotification();
  
  const fetchAppointments = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const userAppointments = await getAppointmentsForUser(user.uid);
        setAppointments(userAppointments);
      } catch (error) {
        console.error("Failed to fetch appointments ->", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch appointments.' });
      } finally {
        setLoading(false);
      }
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchAppointments();
      } else {
        setLoading(false); // Not logged in, stop loading
      }
    }
  }, [user, authLoading, fetchAppointments]);

  const handlePayFromWallet = async (appointmentId: string) => {
    setLoading(true);
    const result = await payFromWallet({ appointmentId });
    if (result.success) {
      toast({ title: 'Success', description: result.success });
      triggerNotificationSound();
      fetchAppointments();
    } else {
      toast({ variant: 'destructive', title: 'Payment Failed', description: result.error });
    }
    setLoading(false); // Ensure loading is set to false in all cases
  };

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case "Confirmed":
        return "default";
      case "InProgress":
        return "secondary";
      case "Completed":
        return "outline";
      case "Cancelled":
        return "destructive";
      case "Pending":
          return "secondary"
      default:
        return "default";
    }
  };
  
  const columns: ColumnDef<Appointment>[] = [
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "barberName", header: "Barber" },
    { accessorKey: "service", header: "Service" },
    {
      accessorKey: "dateTime",
      header: "Date & Time",
      cell: ({ row }) => format(new Date(row.original.dateTime), "PPP p"),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => `PKR ${row.original.price?.toLocaleString() || 'N/A'}`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const appointment = row.original;
        if (!user) return null;

        const otherUserId = user.uid === appointment.barberId ? appointment.customerId : appointment.barberId;
        const isBarber = user.role === 'barber';
        const isCustomer = user.role === 'customer';
        const isAdmin = user.role === 'admin';
        const canPay = isCustomer && appointment.status === 'Completed' && appointment.paymentStatus !== 'Paid';

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <StartChatButton otherUserId={otherUserId} variant="ghost" className="w-full justify-start gap-2" />
                </DropdownMenuItem>
                {(isAdmin || isBarber) && (
                  <EditAppointmentDialog appointment={appointment} onSuccess={fetchAppointments} />
                )}
                
                {isBarber && (
                  <>
                    <DropdownMenuSeparator />
                    {appointment.status === 'Confirmed' && (
                      <StartEndJobDialog
                        appointmentId={appointment.id}
                        action="start"
                        onSuccess={fetchAppointments}
                      />
                    )}
                    {appointment.status === 'InProgress' && (
                      <StartEndJobDialog
                        appointmentId={appointment.id}
                        action="end"
                        onSuccess={fetchAppointments}
                      />
                    )}
                    {appointment.status === 'Completed' && appointment.paymentStatus !== 'Paid' && (
                       <EnterPaymentDialog
                        appointment={appointment}
                        onSuccess={fetchAppointments}
                      />
                    )}
                    <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                  </>
                )}

                {canPay && (
                   <DropdownMenuItem onSelect={() => handlePayFromWallet(appointment.id)}>
                    <Wallet className="mr-2 h-4 w-4" />
                    Pay from Wallet
                  </DropdownMenuItem>
                )}
                
                {appointment.status === 'Completed' && (
                  <>
                    {isCustomer && !appointment.barberRating && (
                      <RateAppointmentDialog
                        appointmentId={appointment.id}
                        ratedUserId={appointment.barberId}
                        ratingField="barberRating"
                        onSuccess={fetchAppointments}
                        userNameToRate={appointment.barberName}
                      />
                    )}
                     {isBarber && !appointment.customerRating && (
                      <RateAppointmentDialog
                        appointmentId={appointment.id}
                        ratedUserId={appointment.customerId}
                        ratingField="customerRating"
                        onSuccess={fetchAppointments}
                        userNameToRate={appointment.customerName}
                      />
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <Card>
       <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>
            Manage all your upcoming and past appointments.
          </CardDescription>
        </div>
        {user && <NewAppointmentDialog onSuccess={fetchAppointments} />}
      </CardHeader>
      <CardContent>
        {loading || authLoading ? (
           <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={appointments}
            filterColumn="service"
            filterPlaceholder="Filter by service..."
            emptyState={
              user ? "No appointments found." : "Please log in to see your appointments."
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
