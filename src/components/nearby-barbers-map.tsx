
// src/components/nearby-barbers-map.tsx
"use client";

import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { useEffect, useRef, useState } from 'react';
import { UserProfile } from "@/lib/firebase/firestore";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

const render = (status: Status) => {
  if (status === Status.LOADING) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (status === Status.FAILURE) return <div>Error loading map</div>;
  return null;
};

interface NearbyBarbersMapProps {
  barbers: UserProfile[];
}

function MapComponent({ barbers }: NearbyBarbersMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(pos);
        },
        () => {
          setCurrentLocation({ lat: 24.8607, lng: 67.0011 }); // Default to Karachi
        }
      );
    }
  }, []);

  useEffect(() => {
    if (ref.current && !map && currentLocation) {
      const newMap = new window.google.maps.Map(ref.current, {
        center: currentLocation,
        zoom: 12,
        mapId: 'CLIPPER_CONNECT_MAP'
      });
      setMap(newMap);

      new google.maps.Marker({
        position: currentLocation,
        map: newMap,
        title: "Your Location",
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "white",
        }
      });
    }
  }, [ref, map, currentLocation]);

  useEffect(() => {
    if (map) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      const newMarkers: google.maps.Marker[] = [];

      // Add markers for filtered barbers
      barbers.forEach((barber) => {
        if (barber.latitude && barber.longitude) {
          const marker = new google.maps.Marker({
            position: { lat: barber.latitude, lng: barber.longitude },
            map: map,
            title: barber.displayName,
          });
          
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${barber.latitude},${barber.longitude}`;
          
          const infoWindowContent = `
            <div class="p-1 font-sans">
                <div class="flex items-center gap-3">
                    <img src="${barber.photoURL}" alt="${barber.displayName}" class="w-12 h-12 rounded-full object-cover" />
                    <div>
                        <h3 class="font-bold text-base">${barber.displayName}</h3>
                        <p class="text-sm text-gray-500">${barber.address || 'Address not available'}</p>
                    </div>
                </div>
                <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    Get Directions
                </a>
            </div>
          `;

          const infoWindow = new google.maps.InfoWindow({
            content: infoWindowContent,
          });

          marker.addListener("click", () => {
            infoWindow.open({
              anchor: marker,
              map,
            });
          });
          newMarkers.push(marker);
        }
      });
      setMarkers(newMarkers);
    }
  }, [map, barbers]);

  return <div ref={ref} id="map" className="h-full w-full" />;
}


export function NearbyBarbersMap({ barbers }: NearbyBarbersMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return <div>Google Maps API Key is missing.</div>
    }

    return (
        <Wrapper apiKey={apiKey} render={render}>
            <MapComponent barbers={barbers} />
        </Wrapper>
    )
}
