
// src/app/appointments/page.tsx
'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAppointmentsForUser, Appointment } from "@/lib/firebase/firestore";
import { MoreHorizontal, Loader2, Star } from "lucide-react";
import { format } from 'date-fns';
import { NewAppointmentDialog } from "@/components/new-appointment-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { StartChatButton } from "@/components/start-chat-button";
import { StartEndJobDialog } from "@/components/start-end-job-dialog";
import { EnterPaymentDialog } from "@/components/enter-payment-dialog";
import { RateAppointmentDialog } from "@/components/rate-appointment-dialog";

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchAppointments = async () => {
    if (user) {
      setLoading(true);
      const userAppointments = await getAppointmentsForUser(user.uid);
      setAppointments(userAppointments);
      setLoading(false);
    } else if (!authLoading) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user, authLoading]);


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
  
  return (
    <Card>
       <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>
            Manage all your upcoming and past appointments.
          </CardDescription>
        </div>
        {user && <NewAppointmentDialog />}
      </CardHeader>
      <CardContent>
        {loading ? (
           <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Barber</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user && appointments.map((appointment) => {
               const otherUserId = user.uid === appointment.barberId ? appointment.customerId : appointment.barberId;
               const isBarber = user.role === 'barber';
               const isCustomer = user.role === 'customer';
               
               return (
                <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.customerName}</TableCell>
                    <TableCell>{appointment.barberName}</TableCell>
                    <TableCell>{appointment.service}</TableCell>
                    <TableCell>{format(new Date(appointment.dateTime), "PPP p")}</TableCell>
                    <TableCell>PKR {appointment.price?.toLocaleString() || 'N/A'}</TableCell>
                    <TableCell>
                    <Badge variant={getStatusVariant(appointment.status)}>{appointment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                
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
                    </TableCell>
                </TableRow>
            )})}
             {(!user || appointments.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">
                  {user ? "No appointments found." : "Please log in to see your appointments."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
