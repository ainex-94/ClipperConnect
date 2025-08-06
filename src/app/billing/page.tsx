// src/app/billing/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DollarSign, MoreHorizontal, TrendingUp, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { type Appointment, getAllAppointments, updateAppointmentPayment } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    if (user && (user.role === 'admin' || user.role === 'barber')) {
      setLoading(true);
      const allAppointments = await getAllAppointments(user.role === 'barber' ? user.uid : undefined);
      setAppointments(allAppointments);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchAppointments();
    }
  }, [user, authLoading]);

  const handleMarkAsPaid = async (appointmentId: string) => {
    const result = await updateAppointmentPayment(appointmentId, 'Paid');
    if (result.success) {
      toast({ title: 'Success', description: 'Appointment marked as paid.' });
      fetchAppointments(); // Refresh data
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const getStatusVariant = (status?: 'Paid' | 'Unpaid') => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Unpaid':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const totalRevenue = appointments
    .filter(a => a.paymentStatus === 'Paid' && a.amountPaid)
    .reduce((sum, a) => sum + a.amountPaid!, 0);
  
  const pendingPayments = appointments
    .filter(a => a.paymentStatus === 'Unpaid' && a.price)
    .reduce((sum, a) => sum + a.price!, 0);
  
  const monthlyEarnings = appointments
    .filter(a => a.paymentStatus === 'Paid' && new Date(a.dateTime).getMonth() === new Date().getMonth() && a.amountPaid)
    .reduce((sum, a) => sum + a.amountPaid!, 0);

  if (authLoading) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!user || (user.role !== 'admin' && user.role !== 'barber')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You do not have permission to view this page. This section is for admins and barbers.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all completed appointments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {monthlyEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Earnings this calendar month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {pendingPayments.toLocaleString()}</div>
             <p className="text-xs text-muted-foreground">From unpaid appointments</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>A list of all recent transactions.</CardDescription>
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
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">{appointment.customerName}</TableCell>
                  <TableCell>{appointment.service}</TableCell>
                  <TableCell>{format(new Date(appointment.dateTime), 'PPP')}</TableCell>
                  <TableCell>PKR {appointment.amountPaid?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(appointment.paymentStatus)}>{appointment.paymentStatus || 'N/A'}</Badge>
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
                        {appointment.paymentStatus !== 'Paid' && (
                          <DropdownMenuItem onClick={() => handleMarkAsPaid(appointment.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>View Invoice</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
