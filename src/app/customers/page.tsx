
// src/app/customers/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCustomers, UserProfile } from "@/lib/firebase/firestore";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StartChatButton } from "@/components/start-chat-button";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";


interface Customer extends UserProfile {
    totalAppointments?: number;
}

export default function CustomersPage() {
    const { user } = useAuth();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchCustomers = async () => {
        setLoading(true);
        const customerData = await getCustomers();
        setCustomers(customerData);
        setLoading(false);
      }
      if (user?.role === 'admin' || user?.role === 'barber') {
        fetchCustomers();
      } else {
        setLoading(false);
      }
    }, [user]);

  if (user?.role !== 'admin' && user?.role !== 'barber') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </CardContent>
      </Card>
    );
  }
    
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'displayName',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage data-ai-hint="person portrait" src={row.original.photoURL} />
            <AvatarFallback>{row.original.displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.original.displayName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => (
        <div>
          <div>{row.original.email}</div>
          <div className="text-muted-foreground text-xs">{row.original.phone || 'N/A'}</div>
        </div>
      )
    },
    {
      accessorKey: 'totalAppointments',
      header: 'Total Appointments',
      cell: ({ row }) => <div className="text-center">{row.original.totalAppointments || 0}</div>
    },
    {
      accessorKey: 'createdAt',
      header: 'Member Since',
      cell: ({ row }) => <div className="text-center">{format(new Date(row.original.createdAt), 'PPP')}</div>
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const customer = row.original;
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
                      <StartChatButton otherUserId={customer.id} variant="ghost" className="w-full justify-start gap-2" />
                   </DropdownMenuItem>
                   <DropdownMenuItem>View Profile</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Customers</CardTitle>
          <CardDescription>A list of all your clients.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
          <DataTable
            columns={columns}
            data={customers}
            filterColumn="displayName"
            filterPlaceholder="Filter by customer name..."
            emptyState="No customers found."
            showAddButton={user.role === 'admin'}
            addButtonText="Add Customer"
          />
        )}
      </CardContent>
    </Card>
  );
}
