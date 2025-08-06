
// src/app/barbers/[barberId]/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { getDocument, getCompletedAppointmentsForBarber, UserProfile, Appointment } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ViewScheduleDialog } from "@/components/view-schedule-dialog";
import { StartChatButton } from "@/components/start-chat-button";
import { NewAppointmentDialog } from "@/components/new-appointment-dialog";
import { Star, MessageSquare, Calendar, Loader2 } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

export default function BarberProfilePage() {
    const { user } = useAuth();
    const params = useParams();
    const barberId = params.barberId as string;
    
    const [barber, setBarber] = useState<UserProfile | null>(null);
    const [reviews, setReviews] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (barberId) {
            const fetchData = async () => {
                setLoading(true);
                const [barberData, appointmentsData] = await Promise.all([
                    getDocument('users', barberId),
                    getCompletedAppointmentsForBarber(barberId)
                ]);

                if (barberData) {
                    setBarber(barberData as UserProfile);
                }
                
                const validReviews = appointmentsData.filter(app => app.barberRating && app.reviewText);
                setReviews(validReviews);

                setLoading(false);
            };
            fetchData();
        }
    }, [barberId]);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!barber) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Barber Not Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>The barber you are looking for does not exist.</p>
                </CardContent>
            </Card>
        );
    }
    
    const images = [barber.photoURL, ...(barber.shopImageUrls || [])];

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column - Profile & Actions */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="items-center text-center">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage data-ai-hint="person portrait" src={barber.photoURL} alt={barber.displayName} />
                                <AvatarFallback>{barber.displayName?.[0]}</AvatarFallback>
                            </Avatar>
                            <CardTitle>{barber.displayName}</CardTitle>
                            <CardDescription>{barber.specialty || 'All-Rounder'}</CardDescription>
                             <div className="flex items-center justify-center gap-2 pt-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <span className="text-xl font-bold">{barber.rating?.toFixed(1) || 'New'}</span>
                                <span className="text-sm text-muted-foreground">({barber.totalRatings || 0} ratings)</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-center text-muted-foreground">{barber.bio || "No bio provided."}</p>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            {user && <NewAppointmentDialog />}
                            <ViewScheduleDialog barber={barber} />
                             {user && <StartChatButton otherUserId={barber.id} />}
                        </CardFooter>
                    </Card>
                </div>

                {/* Right Column - Gallery & Reviews */}
                <div className="md:col-span-2 space-y-8">
                    {/* Gallery */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Gallery</h2>
                        <Carousel className="w-full">
                            <CarouselContent>
                                {images.map((img, index) => (
                                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                    <div className="relative aspect-square">
                                    <Image
                                        src={img}
                                        alt={`Gallery image ${index + 1} for ${barber.displayName}`}
                                        fill
                                        className="object-cover rounded-lg"
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
                    </div>

                    <Separator />
                    
                    {/* Reviews */}
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
                        <div className="space-y-6">
                            {reviews.length > 0 ? (
                                reviews.map(review => (
                                    <Card key={review.id}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                     <Avatar>
                                                        <AvatarImage data-ai-hint="person portrait" src={review.customerPhotoURL} alt={review.customerName} />
                                                        <AvatarFallback>{review.customerName?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{review.customerName}</p>
                                                        <p className="text-xs text-muted-foreground">{format(new Date(review.dateTime), 'PPP')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star 
                                                            key={i} 
                                                            className={cn("w-4 h-4", i < (review.barberRating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300")}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground italic">"{review.reviewText}"</p>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">No written reviews yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

