
// src/app/barbers/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getBarbers, UserProfile } from "@/lib/firebase/firestore";
import { Phone, Mail, Star, MessageSquare, Loader2 } from "lucide-react";
import { ViewScheduleDialog } from "@/components/view-schedule-dialog";
import { StartChatButton } from "@/components/start-chat-button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from 'next/image';
import { NearbyBarbersMap } from "@/components/nearby-barbers-map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Our Barbers</h1>
          <p className="text-muted-foreground">The artists behind the clippers.</p>
        </div>
        {user?.role === 'admin' && <Button>Add New Barber</Button>}
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
              {barbers.map((barber) => {
                const images = [barber.photoURL, ...(barber.shopImageUrls || [])];
                return (
                  <Card key={barber.id} className="flex flex-col">
                    <CardHeader className="p-0">
                      <Carousel className="w-full">
                        <CarouselContent>
                          {images.map((img, index) => (
                            <CarouselItem key={index}>
                              <div className="relative aspect-video">
                                <Image
                                  src={img}
                                  alt={`Photo ${index + 1} for ${barber.displayName}`}
                                  fill
                                  className="object-cover rounded-t-lg"
                                  data-ai-hint={index === 0 ? "person portrait" : "barbershop interior"}
                                />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {images.length > 1 && (
                          <>
                            <CarouselPrevious className="absolute left-2" />
                            <CarouselNext className="absolute right-2" />
                          </>
                        )}
                      </Carousel>
                    </CardHeader>
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="text-center mb-4">
                        <CardTitle>{barber.displayName}</CardTitle>
                        <CardDescription>{barber.specialty || 'All-rounder'}</CardDescription>
                        <div className="flex items-center justify-center gap-1 text-yellow-500 mt-1">
                          <Star className="w-4 h-4 fill-current" />
                          <span>{barber.rating?.toFixed(1) || 'New'}</span>
                        </div>
                      </div>
                      <CardContent className="flex-grow p-0">
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
                      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 p-0">
                          <ViewScheduleDialog barber={barber} />
                          {user && <StartChatButton otherUserId={barber.id} />}
                      </CardFooter>
                    </div>
                  </Card>
                )
              })}
              {barbers.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center">No barbers have registered yet.</p>
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="map">
            <Card className="mt-4">
                <CardContent className="p-0">
                    <div className="h-[600px] w-full">
                       <NearbyBarbersMap barbers={barbers} />
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
