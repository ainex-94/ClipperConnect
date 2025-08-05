
// src/app/customers/page.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

const customers = [
  { name: "Liam Johnson", email: "liam@example.com", phone: "202-555-0198", totalAppointments: 12, lastVisit: "2024-07-28", avatar: "https://placehold.co/100x100.png?text=LJ" },
  { name: "Olivia Smith", email: "olivia@example.com", phone: "202-555-0134", totalAppointments: 8, lastVisit: "2024-08-02", avatar: "https://placehold.co/100x100.png?text=OS" },
  { name: "Noah Williams", email: "noah@example.com", phone: "202-555-0156", totalAppointments: 23, lastVisit: "2024-08-10", avatar: "https://placehold.co/100x100.png?text=NW" },
  { name: "Emma Brown", email: "emma@example.com", phone: "202-555-0187", totalAppointments: 5, lastVisit: "2024-06-15", avatar: "https://placehold.co/100x100.png?text=EB" },
  { name: "Oliver Jones", email: "oliver@example.com", phone: "202-555-0143", totalAppointments: 15, lastVisit: "2024-08-05", avatar: "https://placehold.co/100x100.png?text=OJ" },
];

export default function CustomersPage() {
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
              <TableHead className="text-right">Last Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.email}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage data-ai-hint="person portrait" src={customer.avatar} />
                      <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{customer.name}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                    <div>{customer.email}</div>
                    <div className="text-muted-foreground text-xs">{customer.phone}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-center">{customer.totalAppointments}</TableCell>
                <TableCell className="text-right">{customer.lastVisit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
