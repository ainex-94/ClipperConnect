// src/app/appointments/page.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppointmentsForUser, Appointment, getAllAppointments } from "@/lib/firebase/firestore";
import { MoreHorizontal, Loader2, Wallet, CheckCircle, CreditCard, UserCheck } from "lucide-react";
import { format } from 'date-fns';
import { NewAppointmentDialog } from "@/components/new-appointment-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { StartChatButton } from "@/components/start-chat-button";
import { EnterPaymentDialog } from "@/components/enter-payment-dialog";
import { RateAppointmentDialog } from "@/components/rate-appointment-dialog";
import { EditAppointmentDialog } from "@/components/edit-appointment-dialog";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { updateAppointmentStatus, payFromWallet } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/hooks/use-notification";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PaymentOptionsDialog } from "@/components/payment-options-dialog";
import { AssignWorkerDialog } from "@/components/assign-worker-dialog";

type FilterType = "service" | "appointmentStatus" | "paymentStatus";
const appointmentStatuses: Appointment['status'][] = ['Confirmed', 'Completed', 'Cancelled', 'Pending'];
const paymentStatuses: Appointment['paymentStatus'][] = ['Paid', 'Unpaid'];

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { triggerNotificationSound } = useNotification();
  
  const [filterType, setFilterType] = useState<FilterType>("service");
  const [filterValue, setFilterValue] = useState<string>("");

  const fetchAppointments = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        let userAppointments;
        if (user.role === 'admin') {
            userAppointments = await getAllAppointments();
        } else {
            userAppointments = await getAppointmentsForUser(user.uid);
        }
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
  
  const handleMarkAsCompleted = async (appointmentId: string) => {
    const result = await updateAppointmentStatus({ appointmentId, status: 'Completed' });
    if (result.success) {
      toast({ title: 'Success', description: result.success });
      fetchAppointments();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case "Confirmed":
        return "default";
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

  const getPaymentStatusVariant = (status: Appointment['paymentStatus']) => {
    switch (status) {
        case 'Paid': return 'default';
        case 'Unpaid': return 'destructive';
        default: return 'secondary';
    }
  }

  const filteredAppointments = useMemo(() => {
    if (!filterValue) return appointments;
    if (filterType === 'service') {
        return appointments.filter(a => a.service.toLowerCase().includes(filterValue.toLowerCase()));
    }
    if (filterType === 'appointmentStatus') {
        return appointments.filter(a => a.status === filterValue);
    }
    if (filterType === 'paymentStatus') {
        return appointments.filter(a => a.paymentStatus === filterValue);
    }
    return appointments;
  }, [appointments, filterType, filterValue]);
  
  const columns: ColumnDef<Appointment>[] = [
    { accessorKey: "customerName", header: "Customer" },
    { accessorKey: "barberName", header: "Shop" },
    { 
      accessorKey: "assignedWorkerName", 
      header: "Assigned To",
      cell: ({ row }) => row.original.assignedWorkerName || <span className="text-muted-foreground">N/A</span>
    },
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
      header: "Appt. Status",
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    {
        accessorKey: "paymentStatus",
        header: "Payment Status",
        cell: ({ row }) => (
            <Badge variant={getPaymentStatusVariant(row.original.paymentStatus)}>{row.original.paymentStatus}</Badge>
        )
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }) => row.original.paymentMethod || 'N/A',
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const appointment = row.original;
        if (!user) return null;

        const otherUserId = user.uid === appointment.barberId ? appointment.customerId : appointment.barberId;
        const isBarber = user.role === 'barber';
        const isShopOwner = isBarber && !user.shopOwnerId;
        const isCustomer = user.role === 'customer';
        const isAdmin = user.role === 'admin';
        const canPay = isCustomer && appointment.status === 'Completed' && appointment.paymentStatus !== 'Paid';
        const isCompletedAndUnpaid = appointment.status === 'Completed' && appointment.paymentStatus !== 'Paid';


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
                
                {isShopOwner && (
                   <AssignWorkerDialog appointment={appointment} shopOwnerId={user.uid} onSuccess={fetchAppointments} />
                )}
                
                {isBarber && (
                  <>
                    <DropdownMenuSeparator />
                    {appointment.status === 'Confirmed' && (
                        <DropdownMenuItem onSelect={() => handleMarkAsCompleted(appointment.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Completed
                        </DropdownMenuItem>
                    )}
                    {isCompletedAndUnpaid && (
                       <EnterPaymentDialog
                        appointment={appointment}
                        onSuccess={fetchAppointments}
                      />
                    )}
                    <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                  </>
                )}

                {canPay && (
                   <PaymentOptionsDialog 
                    appointment={appointment} 
                    onSuccess={fetchAppointments}
                   />
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

  const handleFilterTypeChange = (value: FilterType) => {
    setFilterType(value);
    setFilterValue("");
  }

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
          <>
            <div className="flex items-center gap-4 py-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Filter by:</span>
                    <Select value={filterType} onValueChange={(value: FilterType) => handleFilterTypeChange(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select filter type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="appointmentStatus">Appointment Status</SelectItem>
                            <SelectItem value="paymentStatus">Payment Status</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {filterType === 'service' && (
                    <Input 
                        placeholder="Filter by service..."
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        className="max-w-sm"
                    />
                )}
                {filterType === 'appointmentStatus' && (
                    <Select value={filterValue} onValueChange={setFilterValue}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select an appointment status" />
                        </SelectTrigger>
                        <SelectContent>
                            {appointmentStatuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
                 {filterType === 'paymentStatus' && (
                    <Select value={filterValue} onValueChange={setFilterValue}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a payment status" />
                        </SelectTrigger>
                        <SelectContent>
                            {paymentStatuses.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
            <DataTable
                columns={columns}
                data={filteredAppointments}
                emptyState={
                user ? "No appointments found." : "Please log in to see your appointments."
                }
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
