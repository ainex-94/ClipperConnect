// src/app/customers/[customerId]/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { getDocument, getAppointmentsForUser, UserProfile, Appointment } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StartChatButton } from "@/components/start-chat-button";
import { NewAppointmentDialog } from "@/components/new-appointment-dialog";
import { Star, MessageSquare, Calendar, Loader2, Mail, Phone, ShoppingCart, Coins } from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CustomerProfilePage() {
    const { user } = useAuth();
    const params = useParams();
    const customerId = params.customerId as string;
    
    const [customer, setCustomer] = useState<UserProfile | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (customerId) {
            const fetchData = async () => {
                setLoading(true);
                const [customerData, appointmentsData] = await Promise.all([
                    getDocument('users', customerId),
                    getAppointmentsForUser(customerId)
                ]);

                if (customerData) {
                    setCustomer(customerData as UserProfile);
                }
                
                setAppointments(appointmentsData);

                setLoading(false);
            };
            fetchData();
        }
    }, [customerId]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!customer) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Customer Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The customer you are looking for does not exist.</p>
                </CardContent>
            </Card>
        );
    }
    
    const totalAppointments = appointments.length;
    const totalSpent = appointments.reduce((acc, app) => acc + (app.amountPaid || 0), 0);

    const getStatusVariant = (status: Appointment['status']) => {
        switch (status) {
          case "Confirmed": return "default";
          case "InProgress": return "secondary";
          case "Completed": return "outline";
          case "Cancelled": return "destructive";
          case "Pending": return "secondary"
          default: return "default";
        }
    };

    const columns: ColumnDef<Appointment>[] = [
        { 
            accessorKey: "barberName", 
            header: "Barber",
            cell: ({ row }) => <Link href={`/barbers/${row.original.barberId}`} className="hover:underline text-primary">{row.original.barberName}</Link>
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
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column - Profile & Stats */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="items-center text-center">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage data-ai-hint="person portrait" src={customer.photoURL} alt={customer.displayName} />
                                <AvatarFallback>{customer.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <CardTitle>{customer.displayName}</CardTitle>
                             <div className="flex items-center justify-center gap-2 pt-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <span className="text-xl font-bold">{customer.rating?.toFixed(1) || 'New'}</span>
                                <span className="text-sm text-muted-foreground">({customer.totalRatings || 0} ratings)</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{customer.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{customer.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">Member since {format(new Date(customer.createdAt), 'PPP')}</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            {user && <StartChatButton otherUserId={customer.id} />}
                        </CardFooter>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Customer Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><ShoppingCart className="w-4 h-4"/> Total Appointments</span>
                                <span className="font-bold">{totalAppointments}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-2"><Coins className="w-4 h-4"/> Total Spent</span>
                                <span className="font-bold">PKR {totalSpent.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Right Column - Appointment History */}
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appointment History</CardTitle>
                            <CardDescription>A complete record of all past and upcoming appointments for {customer.displayName}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <DataTable
                                columns={columns}
                                data={appointments}
                                filterColumn="service"
                                filterPlaceholder="Filter by service..."
                                emptyState="This customer has no appointments yet."
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
