
// src/app/barbers/page.tsx
'use client';

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getBarbers, UserProfile } from "@/lib/firebase/firestore";
import { Phone, Mail, Star, MessageSquare, Loader2, MapPin } from "lucide-react";
import { ViewScheduleDialog } from "@/components/view-schedule-dialog";
import { StartChatButton } from "@/components/start-chat-button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from 'next/image';
import { NearbyBarbersMap } from "@/components/nearby-barbers-map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
  const [isDistanceFilterEnabled, setIsDistanceFilterEnabled] = useState(false);

  useEffect(() => {
    const fetchBarbers = async () => {
      setLoading(true);
      const barbersData = await getBarbers();
      setBarbers(barbersData);
      setLoading(false);
    };

    fetchBarbers();

    // Get user's location only on the client-side
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsDistanceFilterEnabled(true);
        },
        () => {
          console.warn("Could not get user location. Distance filter disabled.");
          setIsDistanceFilterEnabled(false);
        }
      );
    }
  }, []);
  
  const filteredBarbers = useMemo(() => {
    if (!isDistanceFilterEnabled || !currentLocation) {
        return barbers; // If filter is disabled or no location, return all barbers
    }
    return barbers.filter(barber => {
        if (!barber.latitude || !barber.longitude) return false;
        const distance = getDistance(currentLocation.lat, currentLocation.lng, barber.latitude, barber.longitude);
        return distance <= filterDistance;
    });
  }, [barbers, currentLocation, filterDistance, isDistanceFilterEnabled]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Our Barbers</h1>
          <p className="text-muted-foreground">The artists behind the clippers.</p>
        </div>
        {currentLocation && (
          <div className="flex flex-col items-end gap-4 w-full sm:w-auto">
            <div className="flex items-center space-x-2">
              <Switch
                id="distance-filter-switch"
                checked={isDistanceFilterEnabled}
                onCheckedChange={setIsDistanceFilterEnabled}
              />
              <Label htmlFor="distance-filter-switch">Filter by distance</Label>
            </div>
            {isDistanceFilterEnabled && (
              <div className="w-full sm:w-auto sm:min-w-64 space-y-2">
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
                const ratingValue = barber.rating || 0;
                const distance = currentLocation && barber.latitude && barber.longitude
                    ? getDistance(currentLocation.lat, currentLocation.lng, barber.latitude, barber.longitude)
                    : null;
                const hasLocation = barber.latitude && barber.longitude;
                const mapsUrl = hasLocation ? `https://www.google.com/maps/dir/?api=1&destination=${barber.latitude},${barber.longitude}` : '#';
                
                return (
                  <Card key={barber.id} className="flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
                    <Link href={`/barbers/${barber.id}`} className="flex flex-col flex-grow">
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
                          <div className="flex items-center justify-center gap-1 mt-1">
                             {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn("w-4 h-4", i < ratingValue ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">({barber.totalRatings || 0})</span>
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
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{distance ? `${distance.toFixed(1)} km away` : 'Location not available'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Link>
                    <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4 p-4">
                        {hasLocation && (
                           <Button asChild variant="outline" size="sm" className="w-full" onClick={(e) => e.stopPropagation()}>
                                <Link href={mapsUrl} target="_blank" rel="noopener noreferrer">
                                    <MapPin className="mr-2 h-4 w-4"/>
                                    Directions
                                </Link>
                            </Button>
                        )}
                        {user && <StartChatButton otherUserId={barber.id} />}
                    </CardFooter>
                  </Card>
                )
              })}
              {filteredBarbers.length === 0 && !loading && (
                <p className="text-muted-foreground col-span-full text-center py-12">
                  {isDistanceFilterEnabled ? `No barbers found within ${filterDistance}km. Try expanding your search radius or turning off the distance filter.` : 'No barbers found.'}
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
