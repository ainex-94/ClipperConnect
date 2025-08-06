// src/app/barbers/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getBarbers, UserProfile } from "@/lib/firebase/firestore";
import { Phone, Mail, Star, MessageSquare, Loader2 } from "lucide-react";
import { ViewScheduleDialog } from "@/components/view-schedule-dialog";
import { StartChatButton } from "@/components/start-chat-button";

export default function BarbersPage() {
  const { user } = useAuth();
  const [barbers, setBarbers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarbers = async () => {
      setLoading(true);
      const barbersData = await getBarbers();
      setBarbers(barbersData);
      setLoading(false);
    };

    fetchBarbers();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Our Barbers</h1>
          <p className="text-muted-foreground">The artists behind the clippers.</p>
        </div>
        {user?.role === 'admin' && <Button>Add New Barber</Button>}
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {barbers.map((barber) => (
            <Card key={barber.id} className="flex flex-col">
              <CardHeader className="items-center">
                <Avatar className="w-24 h-24 mb-2">
                  <AvatarImage data-ai-hint="person portrait" src={barber.photoURL} />
                  <AvatarFallback>{barber.displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <CardTitle>{barber.displayName}</CardTitle>
                <CardDescription>{barber.specialty || 'All-rounder'}</CardDescription>
                <div className="flex items-center gap-1 text-yellow-500 mt-1">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{barber.rating || 4.8}</span>
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
                    <span>{barber.phone || '+1 234 567 890'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                  <ViewScheduleDialog barber={barber} />
                  {user && <StartChatButton otherUserId={barber.id} />}
              </CardFooter>
            </Card>
          ))}
          {barbers.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center">No barbers have registered yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
