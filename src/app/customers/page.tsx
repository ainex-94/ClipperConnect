// src/app/customers/page.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/firebase/auth-actions";
import { getCustomers } from "@/lib/firebase/firestore";
import { Search, MoreHorizontal } from "lucide-react";
import { format } from 'date-fns';
import { redirect } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StartChatButton } from "@/components/start-chat-button";

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
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    if (user.role === 'customer') {
      redirect('/');
    }
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
                {user.role === 'admin' && <Button>Add Customer</Button>}
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
              <TableHead className="hidden sm:table-cell text-center">Member Since</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell className="hidden sm:table-cell text-center">{format(new Date(customer.createdAt), 'PPP')}</TableCell>
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
                              <StartChatButton otherUserId={customer.id} variant="ghost" className="w-full justify-start gap-2" />
                           </DropdownMenuItem>
                           <DropdownMenuItem>View Profile</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
             {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
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
