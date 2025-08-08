// src/components/recent-sales.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Appointment } from "@/lib/firebase/firestore";

interface RecentSalesProps {
    appointments: Appointment[];
}

export function RecentSales({ appointments }: RecentSalesProps) {
  const recentPaidAppointments = appointments
    .filter(a => a.paymentStatus === 'Paid')
    .sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
        {recentPaidAppointments.length > 0 ? recentPaidAppointments.map(appointment => (
            <div className="flex items-center" key={appointment.id}>
                <Avatar className="h-9 w-9">
                    <AvatarImage data-ai-hint="person portrait" src={appointment.customerPhotoURL} alt={appointment.customerName} />
                    <AvatarFallback>{appointment.customerName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{appointment.customerName}</p>
                    <p className="text-sm text-muted-foreground">{appointment.service}</p>
                </div>
                <div className="ml-auto font-medium">+PKR {appointment.amountPaid?.toLocaleString()}</div>
            </div>
        )) : (
            <p className="text-sm text-muted-foreground text-center py-4">No recent sales.</p>
        )}
    </div>
  );
}
