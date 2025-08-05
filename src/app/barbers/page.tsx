
// src/app/barbers/page.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Star } from "lucide-react";

const barbers = [
  { name: "Alexandre Dubois", specialty: "Classic Cuts", rating: 4.9, avatar: "https://placehold.co/128x128.png?text=AD", email: "alex.d@example.com", phone: "+1 234 567 890" },
  { name: "Maxime Durand", specialty: "Modern Fades", rating: 4.8, avatar: "https://placehold.co/128x128.png?text=MD", email: "max.d@example.com", phone: "+1 345 678 901" },
  { name: "Lucas Martin", specialty: "Beard Sculpting", rating: 4.9, avatar: "https://placehold.co/128x128.png?text=LM", email: "lucas.m@example.com", phone: "+1 456 789 012" },
  { name: "Julien Moreau", specialty: "Creative Color", rating: 4.7, avatar: "https://placehold.co/128x128.png?text=JM", email: "julien.m@example.com", phone: "+1 567 890 123" },
];

export default function BarbersPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Our Barbers</h1>
          <p className="text-muted-foreground">The artists behind the clippers.</p>
        </div>
        <Button>Add New Barber</Button>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {barbers.map((barber) => (
          <Card key={barber.name} className="flex flex-col">
            <CardHeader className="items-center">
              <Avatar className="w-24 h-24 mb-2">
                <AvatarImage data-ai-hint="person portrait" src={barber.avatar} />
                <AvatarFallback>{barber.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <CardTitle>{barber.name}</CardTitle>
              <CardDescription>{barber.specialty}</CardDescription>
              <div className="flex items-center gap-1 text-yellow-500 mt-1">
                <Star className="w-4 h-4 fill-current" />
                <span>{barber.rating}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{barber.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{barber.phone}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Schedule</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
