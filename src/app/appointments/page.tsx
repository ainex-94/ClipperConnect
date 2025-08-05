
// src/app/appointments/page.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";

const appointments = [
  { id: "APT001", customer: "Liam Johnson", barber: "Alexandre Dubois", service: "Men's Haircut", date: "2024-08-15", time: "10:00 AM", status: "Confirmed" },
  { id: "APT002", customer: "Olivia Smith", barber: "Maxime Durand", service: "Beard Trim", date: "2024-08-15", time: "10:30 AM", status: "Confirmed" },
  { id: "APT003", customer: "Noah Williams", barber: "Lucas Martin", service: "Haircut + Shave", date: "2024-08-15", time: "11:00 AM", status: "Pending" },
  { id: "APT004", customer: "Emma Brown", barber: "Alexandre Dubois", service: "Kids Haircut", date: "2024-08-15", time: "11:30 AM", status: "Completed" },
  { id: "APT005", customer: "Oliver Jones", barber: "Maxime Durand", service: "Foil Shave", date: "2024-08-16", time: "02:00 PM", status: "Cancelled" },
  { id: "APT006", customer: "Ava Garcia", barber: "Lucas Martin", service: "Line Up", date: "2024-08-16", time: "02:45 PM", status: "Confirmed" },
];

export default function AppointmentsPage() {
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
                <TableCell>{appointment.date} @ {appointment.time}</TableCell>
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
