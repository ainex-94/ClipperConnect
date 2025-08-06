
// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { RescheduleTool } from "@/components/reschedule-tool";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { getAppointmentsForUser, Appointment } from "@/lib/firebase/firestore";
import { format } from 'date-fns';
import { Loader2, Coins } from 'lucide-react';
import { StartChatButton } from '@/components/start-chat-button';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const coins = user?.coins || 0;
  const coinValuePKR = (coins / 1000) * 5;

  useEffect(() => {
    if (user) {
      const fetchAppointments = async () => {
        setDataLoading(true);
        const userAppointments = await getAppointmentsForUser(user.uid);
        setAppointments(userAppointments);

        const today = new Date();
        const upcoming = userAppointments
          .filter(app => {
            if (!app.dateTime) return false;
            const appDate = new Date(app.dateTime);
            // Show appointments for today
            return (
              appDate.getDate() === today.getDate() &&
              appDate.getMonth() === today.getMonth() &&
              appDate.getFullYear() === today.getFullYear() &&
              app.status === 'Confirmed'
            );
          })
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
        
        setUpcomingAppointments(upcoming);
        setDataLoading(false);
      };

      fetchAppointments();
    } else if (!loading) {
      // If user is not logged in and auth check is complete
      setDataLoading(false);
    }
  }, [user, loading]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 fade-in-animation">
      
      {(!user || user.role !== 'customer') && (
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Intelligent Rescheduling</CardTitle>
              <CardDescription>
                Need to move an appointment? Our AI will find the best alternative slots based on everyone's availability and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <RescheduleTool />
              ) : (
                <p className="text-muted-foreground">Please log in as a barber or admin to use the rescheduling tool.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className={!user || user.role === 'customer' ? "lg:col-span-3" : "lg:col-span-1"}>
        {user && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Coins</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coins.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">≈ PKR {coinValuePKR.toFixed(2)}</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Here are your confirmed appointments for today.</CardDescription>
          </CardHeader>
          <CardContent>
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : user && upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment, index) => {
                    const otherPersonName = user.role === 'barber' ? appointment.customerName : appointment.barberName;
                    const otherPersonId = user.role === 'barber' ? appointment.customerId : appointment.barberId;
                    const otherPersonPhoto = user.role === 'barber' ? appointment.customerPhotoURL : appointment.barberPhotoURL;
                    
                    return (
                    <div key={appointment.id}>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage data-ai-hint="person portrait" src={otherPersonPhoto} alt={otherPersonName} />
                          <AvatarFallback>{otherPersonName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                              <div>
                                  <p className="font-medium">{otherPersonName}</p>
                                  <p className="text-sm text-muted-foreground">{appointment.service}</p>
                              </div>
                              <div className="text-right">
                                  <p className="font-semibold">{format(new Date(appointment.dateTime), "p")}</p>
                              </div>
                          </div>
                          <StartChatButton 
                            otherUserId={otherPersonId}
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full sm:w-auto"
                          />
                        </div>
                      </div>
                      {index < upcomingAppointments.length - 1 && <Separator className="mt-4" />}
                    </div>
                  )})}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {user ? "No upcoming appointments today." : "Log in to see your appointments."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
