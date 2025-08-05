// src/app/appointments/page.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCollection } from "@/lib/firebase/firestore";
import { MoreHorizontal } from "lucide-react";
import { format } from 'date-fns';

interface Appointment {
  id: string;
  customer: string;
  barber: string;
  service: string;
  dateTime: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
}

export default async function AppointmentsPage() {
  const appointments: Appointment[] = await getCollection("appointments");

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "default";
      case "Pending":
        return "secondary";
      case "Completed":
        return "outline";
      case "Cancelled":
        return "destructive";
      default:
        return "default";
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
        <CardDescription>
          Manage all your upcoming and past appointments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Barber</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">{appointment.customer}</TableCell>
                <TableCell>{appointment.barber}</TableCell>
                <TableCell>{appointment.service}</TableCell>
                <TableCell>{format(new Date(appointment.dateTime), "PPP p")}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(appointment.status) as any}>{appointment.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
