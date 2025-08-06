// src/app/appointments/page.tsx
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAppointmentsForUser } from "@/lib/firebase/firestore";
import { MoreHorizontal } from "lucide-react";
import { format } from 'date-fns';
import { NewAppointmentDialog } from "@/components/new-appointment-dialog";
import { getCurrentUser } from "@/lib/firebase/auth-actions";
import { redirect } from "next/navigation";

interface Appointment {
  id: string;
  customerName: string;
  barberName: string;
  service: string;
  dateTime: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
}

export default async function AppointmentsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const appointments: Appointment[] = await getAppointmentsForUser(user.uid, user.role);

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
       <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>
            Manage all your upcoming and past appointments.
          </CardDescription>
        </div>
        {(user.role === 'customer' || user.role === 'admin') && <NewAppointmentDialog />}
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
                <TableCell className="font-medium">{appointment.customerName}</TableCell>
                <TableCell>{appointment.barberName}</TableCell>
                <TableCell>{appointment.service}</TableCell>
                <TableCell>{format(new Date(appointment.dateTime), "PPP p")}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(appointment.status) as any}>{appointment.status}</Badge>
                </TableCell>
                <TableCell>
                  {/* Dropdown can be added here for actions like 'Edit', 'Cancel' */}
                </TableCell>
              </TableRow>
            ))}
             {appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">
                  No appointments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
