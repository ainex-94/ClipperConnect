// src/app/customers/page.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCustomers } from "@/lib/firebase/firestore";
import { Search } from "lucide-react";
import { format } from 'date-fns';

interface Customer {
    id: string;
    displayName: string;
    email: string;
    photoURL: string;
    phone?: string;
    totalAppointments?: number;
    createdAt: string;
}

export default async function CustomersPage() {
    const customers: Customer[] = await getCustomers();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>A list of all your clients.</CardDescription>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search customers..." className="pl-8 w-full" />
                </div>
                <Button>Add Customer</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="hidden sm:table-cell">Total Appointments</TableHead>
              <TableHead className="text-right">Member Since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage data-ai-hint="person portrait" src={customer.photoURL} />
                      <AvatarFallback>{customer.displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{customer.displayName}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    <div>{customer.email}</div>
                    <div className="text-muted-foreground text-xs">{customer.phone || 'N/A'}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-center">{customer.totalAppointments || 0}</TableCell>
                <TableCell className="text-right">{format(new Date(customer.createdAt), 'PPP')}</TableCell>
              </TableRow>
            ))}
             {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
