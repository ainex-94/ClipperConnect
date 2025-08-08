// src/app/billing/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DollarSign, MoreHorizontal, TrendingUp, CreditCard, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { type Appointment, getAllAppointments, getAppointmentsForUser } from '@/lib/firebase/firestore';
import { InvoiceDialog } from '@/components/invoice-dialog';
import { DataTable } from '@/components/ui/data-table';
import { type ColumnDef } from "@tanstack/react-table";
import { useToast } from '@/hooks/use-toast';

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        let userAppointments: Appointment[] = [];
        if (user.role === 'admin' || user.role === 'barber') {
          userAppointments = await getAllAppointments(user.role === 'barber' ? user.uid : undefined);
        } else if (user.role === 'customer') {
          userAppointments = await getAppointmentsForUser(user.uid);
        }
        setAppointments(userAppointments);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch transaction history.' });
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
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please log in to view your billing history.</p>
        </CardContent>
      </Card>
    );
  }

  const isBusinessView = user.role === 'admin' || user.role === 'barber';

  const columns: ColumnDef<Appointment>[] = [
    {
      accessorKey: isBusinessView ? 'customerName' : 'barberName',
      header: isBusinessView ? 'Customer' : 'Barber',
    },
    { accessorKey: "service", header: "Service" },
    {
      accessorKey: "dateTime",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.dateTime), 'PPP'),
    },
    {
      accessorKey: "amountPaid",
      header: "Amount Paid",
      cell: ({ row }) => `PKR ${row.original.amountPaid?.toLocaleString() || 'N/A'}`,
    },
    {
      accessorKey: "paymentStatus",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.paymentStatus)}>{row.original.paymentStatus || 'N/A'}</Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const appointment = row.original;
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
                 <InvoiceDialog appointment={appointment} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
       {isBusinessView && (
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
      )}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {isBusinessView ? 'A list of all recent transactions.' : 'A list of all your past payments.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={appointments}
              filterColumn={isBusinessView ? "customerName" : "barberName"}
              filterPlaceholder={isBusinessView ? "Filter by customer..." : "Filter by barber..."}
              emptyState="No transactions found."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
