import { RescheduleTool } from "@/components/reschedule-tool";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const appointments = [
    {
      name: "Jordan P.",
      service: "Haircut + Beard Trim",
      time: "10:30 AM",
      avatar: "https://placehold.co/100x100.png?text=JP",
    },
    {
      name: "Alex S.",
      service: "Fadep",
      time: "11:15 AM",
      avatar: "https://placehold.co/100x100.png?text=AS",
    },
    {
      name: "Mike L.",
      service: "Line-up",
      time: "12:00 PM",
      avatar: "https://placehold.co/100x100.png?text=ML",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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

      <div className="lg:col-span-1">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Here are your next few appointments for today.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.map((appointment, index) => (
                <div key={index}>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage data-ai-hint="person portrait" src={appointment.avatar} alt={appointment.name} />
                      <AvatarFallback>{appointment.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{appointment.name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.service}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{appointment.time}</p>
                    </div>
                  </div>
                  {index < appointments.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
