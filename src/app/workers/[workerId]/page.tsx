
// src/app/workers/[workerId]/page.tsx
'use client';

import { useState, useEffect, useCallback } from "react";
import { useParams, notFound } from 'next/navigation';
import { getDocument, getAppointmentsForWorker, UserProfile, Appointment } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Loader2, Mail, Phone, ShoppingCart, Coins, Calendar } from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StatsCard } from "@/components/stats-card";

export default function WorkerProfilePage() {
    const { user } = useAuth();
    const params = useParams();
    const workerId = params.workerId as string;
    
    const [worker, setWorker] = useState<UserProfile | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWorkerData = useCallback(async () => {
        if (workerId) {
            setLoading(true);
            const [workerData, appointmentsData] = await Promise.all([
                getDocument('users', workerId),
                getAppointmentsForWorker(workerId)
            ]);

            if (workerData) {
                setWorker(workerData as UserProfile);
                setAppointments(appointmentsData);
            }
            
            setLoading(false);
        }
    }, [workerId]);

    useEffect(() => {
        fetchWorkerData();
    }, [fetchWorkerData]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!worker) {
        return notFound();
    }
    
    // Security check: Only the shop owner can view worker details
    if (user?.uid !== worker.shopOwnerId) {
         return (
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>You do not have permission to view this worker's details.</p>
                </CardContent>
            </Card>
        );
    }
    
    const totalAppointments = appointments.length;
    const totalEarned = appointments.reduce((acc, app) => acc + (app.amountPaid || 0), 0);
    const ratingValue = worker.rating || 0;
    const appointmentsToday = appointments.filter(app => format(new Date(app.dateTime), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length;


    const getStatusVariant = (status: Appointment['status']) => {
        switch (status) {
          case "Confirmed": return "default";
          case "Completed": return "outline";
          case "Cancelled": return "destructive";
          case "Pending": return "secondary"
          default: return "default";
        }
    };

    const columns: ColumnDef<Appointment>[] = [
        { 
            accessorKey: "customerName", 
            header: "Customer",
            cell: ({ row }) => <Link href={`/customers/${row.original.customerId}`} className="hover:underline text-primary">{row.original.customerName}</Link>
        },
        { accessorKey: "service", header: "Service" },
        {
          accessorKey: "dateTime",
          header: "Date & Time",
          cell: ({ row }) => format(new Date(row.original.dateTime), "PPP p"),
        },
        {
          accessorKey: "price",
          header: "Price",
          cell: ({ row }) => `PKR ${row.original.price?.toLocaleString() || 'N/A'}`,
        },
        {
          accessorKey: "status",
          header: "Status",
          cell: ({ row }) => (
            <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>
          ),
        },
    ];

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-6">
                 <Avatar className="h-24 w-24">
                    <AvatarImage data-ai-hint="person portrait" src={worker.photoURL} alt={worker.displayName} />
                    <AvatarFallback>{worker.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-4xl font-bold">{worker.displayName}</h1>
                    <p className="text-lg text-muted-foreground">{worker.specialty || 'All-Rounder'}</p>
                    <div className="flex items-center gap-2 pt-2">
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn("w-5 h-5", i < ratingValue ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
                            ))}
                        </div>
                        <span className="text-sm text-muted-foreground ml-2">({worker.totalRatings || 0} ratings)</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
               <StatsCard title="Total Appointments" value={totalAppointments} icon={ShoppingCart} description="All-time completed appointments" />
               <StatsCard title="Total Earned" value={`PKR ${totalEarned.toLocaleString()}`} icon={Coins} description="Total revenue generated" />
               <StatsCard title="Appointments Today" value={appointmentsToday} icon={Calendar} description="Completed today" />
               <StatsCard title="Average Rating" value={ratingValue.toFixed(1)} icon={Star} description={`Based on ${worker.totalRatings || 0} reviews`} />
            </div>


            {/* Appointment History */}
            <Card>
                <CardHeader>
                    <CardTitle>Appointment History</CardTitle>
                    <CardDescription>A complete record of all appointments handled by {worker.displayName}.</CardDescription>
                </CardHeader>
                <CardContent>
                     <DataTable
                        columns={columns}
                        data={appointments}
                        filterColumn="customerName"
                        filterPlaceholder="Filter by customer..."
                        emptyState="This worker has no appointments yet."
                    />
                </CardContent>
            </Card>
        </div>
    );
}
