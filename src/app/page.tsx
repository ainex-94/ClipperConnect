// src/app/page.tsx
import { RescheduleTool } from "@/components/reschedule-tool";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/firebase/auth-actions";
import { getAppointmentsForUser } from "@/lib/firebase/firestore";
import { redirect } from "next/navigation";
import { format } from 'date-fns';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const appointments = await getAppointmentsForUser(user.uid, user.role);

  // Filter to show only today's appointments for the "Upcoming" card
  const today = new Date();
  const upcomingAppointments = appointments.filter(app => {
    const appDate = new Date(app.dateTime);
    return appDate.getDate() === today.getDate() &&
           appDate.getMonth() === today.getMonth() &&
           appDate.getFullYear() === today.getFullYear() &&
           app.status === 'Confirmed';
  }).sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {user.role !== 'customer' && (
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Intelligent Rescheduling</CardTitle>
              <CardDescription>
                Need to move an appointment? Our AI will find the best alternative slots based on everyone's availability and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RescheduleTool />
            </CardContent>
          </Card>
        </div>
      )}

      <div className={user.role === 'customer' ? "lg:col-span-3" : "lg:col-span-1"}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Here are your confirmed appointments for today.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment, index) => (
                  <div key={appointment.id}>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        {/* Show the other person's avatar */}
                        <AvatarImage data-ai-hint="person portrait" src={user.role === 'barber' ? (appointment as any).customerPhotoURL : (appointment as any).barberPhotoURL} alt={user.role === 'barber' ? appointment.customerName : appointment.barberName} />
                        <AvatarFallback>{(user.role === 'barber' ? appointment.customerName : appointment.barberName)?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{user.role === 'barber' ? appointment.customerName : appointment.barberName}</p>
                        <p className="text-sm text-muted-foreground">{appointment.service}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{format(new Date(appointment.dateTime), "p")}</p>
                      </div>
                    </div>
                    {index < upcomingAppointments.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">No upcoming appointments today.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
