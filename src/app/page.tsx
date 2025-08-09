// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAppointmentsForUser, getAllAppointments, getCustomers, getRecentAppointments, Appointment } from "@/lib/firebase/firestore";
import { Loader2, DollarSign, Users, Calendar, Star } from 'lucide-react';
import { RescheduleTool } from '@/components/reschedule-tool';
import { StatsCard } from '@/components/stats-card';
import { OverviewChart } from '@/components/overview-chart';
import { RecentSales } from '@/components/recent-sales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { StartChatButton } from '@/components/start-chat-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DashboardStats {
  totalRevenue: number;
  totalCustomers: number;
  totalAppointments: number;
  averageRating: number;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);

      if (user.role === 'admin' || user.role === 'barber') {
        const [allAppointments, allCustomers, recent] = await Promise.all([
          getAllAppointments(user.role === 'barber' ? user.uid : undefined),
          user.role === 'admin' ? getCustomers() : Promise.resolve([]),
          getRecentAppointments(user.role === 'barber' ? user.uid : undefined)
        ]);

        const totalRevenue = allAppointments
          .filter(a => a.paymentStatus === 'Paid' && a.amountPaid)
          .reduce((sum, a) => sum + a.amountPaid!, 0);

        const totalAppointments = allAppointments.length;
        const totalCustomers = allCustomers.length;
        const totalRatings = allAppointments.reduce((sum, a) => sum + (a.barberRating ? 1 : 0), 0);
        const sumOfRatings = allAppointments.reduce((sum, a) => sum + (a.barberRating || 0), 0);
        const averageRating = totalRatings > 0 ? sumOfRatings / totalRatings : 0;

        setStats({ totalRevenue, totalCustomers, totalAppointments, averageRating });
        setAppointments(allAppointments);
        setRecentAppointments(recent);

      } else { // Customer
        const userAppointments = await getAppointmentsForUser(user.uid);
        setAppointments(userAppointments);
      }
      setLoading(false);
    }
    
    if (!authLoading) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!user) {
     return (
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to ClipperConnect</CardTitle>
              <CardDescription>
                The all-in-one platform for barber services. Please log in or register to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <RescheduleTool />
            </CardContent>
          </Card>
        </div>
      )
  }

  // Admin and Barber Dashboard
  if (user.role === 'admin' || user.role === 'barber') {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Revenue" value={`PKR ${stats?.totalRevenue.toLocaleString()}`} icon={DollarSign} description="All-time earnings" />
                {user.role === 'admin' && <StatsCard title="Total Customers" value={`+${stats?.totalCustomers.toLocaleString()}`} icon={Users} description="All registered customers" />}
                <StatsCard title="Total Appointments" value={`+${stats?.totalAppointments.toLocaleString()}`} icon={Calendar} description="All-time appointments" />
                <StatsCard title="Average Rating" value={stats?.averageRating.toFixed(1) || 'N/A'} icon={Star} description="From all-time reviews" />
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <OverviewChart data={appointments} />
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>You made {recentAppointments.filter(a => a.paymentStatus === 'Paid').length} sales recently.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecentSales appointments={recentAppointments} />
                    </CardContent>
                </Card>
             </div>
        </div>
    )
  }

  // Customer Dashboard
  const upcomingAppointment = appointments
    .filter(a => new Date(a.dateTime) > new Date() && a.status === 'Confirmed')
    .sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];

  const totalSpent = appointments
    .filter(a => a.paymentStatus === 'Paid')
    .reduce((sum, a) => sum + (a.amountPaid || 0), 0);

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           <StatsCard title="Total Appointments" value={appointments.length} icon={Calendar} description="All your past and future bookings" />
           <StatsCard title="Total Spent" value={`PKR ${totalSpent.toLocaleString()}`} icon={DollarSign} description="Thank you for your business!" />
           <StatsCard title="Your Coins" value={(user.coins || 0).toLocaleString()} icon={Users} description={`≈ PKR ${((user.coins || 0) / 1000 * 5).toFixed(2)}`} />
        </div>
        {upcomingAppointment ? (
            <Card>
                <CardHeader>
                    <CardTitle>Your Next Appointment</CardTitle>
                    <CardDescription>Don't be late! Here are the details for your next booking.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <Avatar className="h-20 w-20">
                          <AvatarImage data-ai-hint="person portrait" src={upcomingAppointment.barberPhotoURL} alt={upcomingAppointment.barberName} />
                          <AvatarFallback>{upcomingAppointment.barberName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full sm:w-auto text-center sm:text-left">
                            <div className="sm:col-span-1">
                                <p className="font-semibold text-lg">{upcomingAppointment.barberName}</p>
                                <p className="text-muted-foreground">{upcomingAppointment.service}</p>
                            </div>
                             <div className="sm:col-span-1 flex flex-col items-center justify-center">
                                <p className="font-bold text-primary text-lg">{format(new Date(upcomingAppointment.dateTime), "PPP")}</p>
                                <p className="font-bold text-primary text-lg">{format(new Date(upcomingAppointment.dateTime), "p")}</p>
                            </div>
                             <div className="sm:col-span-1 flex items-center justify-center">
                                <StartChatButton otherUserId={upcomingAppointment.barberId} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        ) : (
            <Card>
                <CardHeader>
                    <CardTitle>No Upcoming Appointments</CardTitle>
                    <CardDescription>You have no scheduled appointments. Time for a fresh look?</CardDescription>
                </CardHeader>
            </Card>
        )}
    </div>
  );
}
