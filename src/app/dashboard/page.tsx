// src/app/dashboard/page.tsx
'use client';

import { StatsCard } from "@/components/stats-card";
import { DollarSign, Users, Calendar, Star } from "lucide-react";
import { OverviewChart } from "@/components/overview-chart";
import { RecentSales } from "@/components/recent-sales";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
    // This is a placeholder for the real data fetching logic
    const stats = {
        totalRevenue: 45231.89,
        totalCustomers: 2350,
        totalAppointments: 12234,
        averageRating: 4.8,
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} description="+20.1% from last month" />
                <StatsCard title="Subscriptions" value={`+${stats.totalCustomers.toLocaleString()}`} icon={Users} description="+180.1% from last month" />
                <StatsCard title="Sales" value={`+${stats.totalAppointments.toLocaleString()}`} icon={Calendar} description="+19% from last month" />
                <StatsCard title="Active Now" value="+573" icon={Star} description="+201 since last hour" />
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <OverviewChart />
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                        <CardDescription>You made 265 sales this month.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecentSales />
                    </CardContent>
                </Card>
             </div>
        </div>
    )
}
