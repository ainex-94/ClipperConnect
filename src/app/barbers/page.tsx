
// src/app/barbers/page.tsx
'use client';

import { useState, useEffect, useMemo } from "react";
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
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

// Haversine formula to calculate distance between two lat/lng points
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    0.5 - Math.cos(dLat) / 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    (1 - Math.cos(dLon)) / 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export default function BarbersPage() {
  const { user } = useAuth();
  const [barbers, setBarbers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filterDistance, setFilterDistance] = useState<number>(50); // Default 50km

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Handle location error or denial by doing nothing, so no distance filter is applied.
          console.warn("Could not get user location. Distance filter disabled.");
        }
      );
    }
  }, []);

  useEffect(() => {
    const fetchBarbers = async () => {
      setLoading(true);
      const barbersData = await getBarbers();
      setBarbers(barbersData);
      setLoading(false);
    };

    fetchBarbers();
  }, []);
  
  const filteredBarbers = useMemo(() => {
    if (!currentLocation) {
        return barbers; // If no location, return all barbers
    }
    return barbers.filter(barber => {
        if (!barber.latitude || !barber.longitude) return false;
        const distance = getDistance(currentLocation.lat, currentLocation.lng, barber.latitude, barber.longitude);
        return distance <= filterDistance;
    });
  }, [barbers, currentLocation, filterDistance]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Our Barbers</h1>
          <p className="text-muted-foreground">The artists behind the clippers.</p>
        </div>
        {currentLocation && (
           <div className="w-full sm:w-auto sm:max-w-xs space-y-2">
              <Label htmlFor="distance-slider" className="flex justify-between">
                <span>Distance</span>
                <span>{filterDistance} km</span>
              </Label>
              <Slider
                id="distance-slider"
                defaultValue={[50]}
                max={100}
                step={1}
                onValueChange={(value) => setFilterDistance(value[0])}
              />
          </div>
        )}
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
              {filteredBarbers.map((barber) => {
                const images = [barber.photoURL, ...(barber.shopImageUrls || [])];
                return (
                  <Link key={barber.id} href={`/barbers/${barber.id}`} className="flex flex-col">
                    <Card className="flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
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
                  </Link>
                )
              })}
              {filteredBarbers.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-12">
                  No barbers found within {filterDistance}km. Try expanding your search radius.
                </p>
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="map">
            <Card className="mt-4">
                <CardContent className="p-0">
                    <div className="h-[600px] w-full">
                       <NearbyBarbersMap barbers={filteredBarbers} />
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
