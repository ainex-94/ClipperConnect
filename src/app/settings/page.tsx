// src/app/settings/page.tsx
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Loader2, Camera, Upload, X, MapPin, LocateFixed } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadImage, updateUserProfile, updateUserLocation, updateUserAvailability } from "@/app/actions";
import Image from "next/image";
import { AddressAutocompleteInput } from "@/components/address-autocomplete";
import { useTheme } from "next-themes";

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  // State for forms
  const [profileData, setProfileData] = useState({ displayName: "", email: "", bio: "" });
  const [locationData, setLocationData] = useState({ address: "", latitude: "", longitude: "" });
  const [availability, setAvailability] = useState<Record<string, { start: string; end: string; enabled: boolean }>>({});
  
  // State for UI
  const [shopImageUrls, setShopImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  
  // Notification state (remains client-side for this demo)
  const [notificationPrefs, setNotificationPrefs] = useState({
    appointments: true,
    reschedules: false,
    promotions: true,
    pushAll: true,
  });
  
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const shopPhotoInputRef = useRef<HTMLInputElement>(null);

  // Load user data into state
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        setLoading(true);
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setProfileData({
            displayName: userData.displayName || "",
            email: userData.email || "",
            bio: userData.bio || "",
          });
          if(user.role === 'barber') {
            setLocationData({
              address: userData.address || "",
              latitude: userData.latitude?.toString() || "",
              longitude: userData.longitude?.toString() || "",
            });
            setShopImageUrls(userData.shopImageUrls || []);
            const initialAvailability: any = {};
            daysOfWeek.forEach(day => {
              const dayAvail = userData.availability?.[day];
              initialAvailability[day] = {
                start: dayAvail?.start || "09:00",
                end: dayAvail?.end || "17:00",
                enabled: !!dayAvail,
              };
            });
            setAvailability(initialAvailability);
          }
        }
        setLoading(false);
      };
      fetchUserData();
    }
  }, [user]);
  
  // Handlers for UI changes
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setProfileData(prev => ({ ...prev, [id]: value }));
  }
  
  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setLocationData(prev => ({ ...prev, [id]: value }));
  }

  const handleAvailabilityChange = (day: string, field: 'start' | 'end' | 'enabled', value: string | boolean) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };
  
  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    const lat = place.geometry?.location?.lat();
    const lng = place.geometry?.location?.lng();
    setLocationData({
      address: place.formatted_address || '',
      latitude: lat?.toString() || '',
      longitude: lng?.toString() || '',
    });
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'Geolocation Error', description: 'Geolocation is not supported by your browser.' });
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
           toast({ variant: 'destructive', title: 'Configuration Error', description: 'Google Maps API Key is missing.' });
           setIsFetchingLocation(false);
           return;
        }

        try {
          const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
          const data = await response.json();
          if (data.status === 'OK' && data.results[0]) {
            handlePlaceSelect({
              formatted_address: data.results[0].formatted_address,
              geometry: { location: new google.maps.LatLng(latitude, longitude) }
            } as google.maps.places.PlaceResult);
            toast({ title: 'Location Found', description: 'Address and coordinates have been updated.' });
          } else {
             throw new Error(data.error_message || 'No results found.');
          }
        } catch (error) {
           console.error('Geocoding error:', error);
           toast({ variant: 'destructive', title: 'Geocoding Error', description: 'Could not fetch address. Please enter manually.' });
            setLocationData(prev => ({ ...prev, latitude: latitude.toString(), longitude: longitude.toString() }));
        } finally {
            setIsFetchingLocation(false);
        }
      },
      (error) => {
        toast({ variant: 'destructive', title: 'Geolocation Error', description: error.message });
        setIsFetchingLocation(false);
      }
    );
  };

  // Save handlers for each section
  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    const result = await updateUserProfile({ userId: user.uid, ...profileData });
    if (result.success) {
      await refreshUser();
      toast({ title: "Success", description: "Profile updated successfully." });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setIsSavingProfile(false);
  };

  const handleSaveLocation = async () => {
    if (!user) return;
    setIsSavingLocation(true);
    const lat = parseFloat(locationData.latitude);
    const lng = parseFloat(locationData.longitude);
    const result = await updateUserLocation({
        userId: user.uid,
        address: locationData.address,
        latitude: !isNaN(lat) ? lat : null,
        longitude: !isNaN(lng) ? lng : null,
    });
    if (result.success) {
        toast({ title: "Success", description: "Location updated successfully." });
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setIsSavingLocation(false);
  };
  
  const handleSaveAvailability = async () => {
    if (!user) return;
    setIsSavingAvailability(true);
    const availabilityToSave: any = {};
    Object.keys(availability).forEach(day => {
        if (availability[day]?.enabled) {
            availabilityToSave[day] = { start: availability[day].start, end: availability[day].end };
        }
    });
    const result = await updateUserAvailability({ userId: user.uid, availability: availabilityToSave });
    if (result.success) {
        toast({ title: "Success", description: "Availability updated successfully." });
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setIsSavingAvailability(false);
  };

  // Image handlers
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, folder: string, isProfilePic: boolean = false) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    
    setIsUploading(true);
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    formData.append("fileName", `${user.uid}-${Date.now()}`);

    try {
      const result = await uploadImage(formData);
      if (result.error || !result.url) throw new Error(result.error || "Upload failed");
      
      const userRef = doc(db, "users", user.uid);
      if (isProfilePic) {
        await updateDoc(userRef, { photoURL: result.url });
        await refreshUser();
        toast({ title: "Success", description: "Profile picture updated." });
      } else {
        await updateDoc(userRef, { shopImageUrls: arrayUnion(result.url) });
        setShopImageUrls(prev => [...prev, result.url!]);
        toast({ title: "Success", description: "Shop photo added." });
      }
    } catch (error) {
      console.error("Error uploading image: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to upload image." });
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = "";
    }
  };

  const handleDeleteShopPhoto = async (imageUrl: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { shopImageUrls: arrayRemove(imageUrl) });
      setShopImageUrls(prev => prev.filter(url => url !== imageUrl));
      toast({ title: "Success", description: "Shop photo removed." });
    } catch (error) {
      console.error("Error deleting shop photo: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to remove shop photo." });
    }
  };

  // Notification handler (client-side)
  const handleSaveNotificationPrefs = () => {
    toast({ title: "Preferences Saved", description: "Your notification settings have been updated." });
  };
  
  if (loading || !user) {
      return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and workspace preferences.</p>
      </div>

      <Separator />

      {/* Profile Section */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">Update your personal information and profile picture.</p>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                 <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                        <AvatarImage data-ai-hint="person" src={user?.photoURL || ''} />
                        <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <input type="file" ref={profilePicInputRef} onChange={(e) => handleImageUpload(e, 'profile_pictures', true)} className="hidden" accept="image/*" />
                    <Button size="icon" variant="outline" className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background" onClick={() => profilePicInputRef.current?.click()} disabled={isUploading}>
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={profileData.displayName} onChange={handleProfileInputChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profileData.email} onChange={handleProfileInputChange} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" placeholder="Tell us a little about yourself." value={profileData.bio} onChange={handleProfileInputChange} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSaveProfile} disabled={isSavingProfile || isUploading}>
                {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {user.role === 'barber' && (
        <>
        {/* Shop Location Section */}
        <Separator />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <h2 className="text-xl font-semibold">Shop Location</h2>
              <p className="text-sm text-muted-foreground">Let customers find you on the map.</p>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5"/> Address</CardTitle>
                     <Button variant="outline" size="sm" onClick={handleFetchLocation} disabled={isFetchingLocation}>
                        {isFetchingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Fetch My Location</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address</Label>
                    <AddressAutocompleteInput id="address" value={locationData.address} onChange={(e) => setLocationData(prev => ({ ...prev, address: e.target.value }))} onPlaceSelect={handlePlaceSelect} placeholder="e.g., 123 Barber Street, Shop #4" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input id="latitude" value={locationData.latitude} onChange={handleLocationInputChange} placeholder="e.g., 24.8607" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input id="longitude" value={locationData.longitude} onChange={handleLocationInputChange} placeholder="e.g., 67.0011" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleSaveLocation} disabled={isSavingLocation || isFetchingLocation}>
                        {isSavingLocation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Location
                    </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        {/* Shop Photos Section */}
        <Separator />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <h2 className="text-xl font-semibold">Shop Photos</h2>
              <p className="text-sm text-muted-foreground">Showcase your barbershop to potential customers.</p>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {shopImageUrls.map((url) => (
                      <div key={url} className="relative group aspect-square">
                        <Image src={url} alt="Shop photo" layout="fill" className="rounded-md object-cover" />
                        <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteShopPhoto(url)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                     <div className="aspect-square flex items-center justify-center border-2 border-dashed rounded-md">
                        <input type="file" ref={shopPhotoInputRef} onChange={(e) => handleImageUpload(e, 'shop_photos')} className="hidden" accept="image/*" disabled={isUploading} />
                        <Button variant="outline" size="icon" onClick={() => shopPhotoInputRef.current?.click()} disabled={isUploading}>
                           {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                        </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        {/* Availability Section */}
        <Separator />
         <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <h2 className="text-xl font-semibold">Availability</h2>
              <p className="text-sm text-muted-foreground">Set your weekly working hours.</p>
            </div>
            <div className="md:col-span-2">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {daysOfWeek.map(day => (
                    <div key={day} className="flex items-center justify-between gap-4 p-2 rounded-md transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <Checkbox id={`enabled-${day}`} checked={availability[day]?.enabled} onCheckedChange={(checked) => handleAvailabilityChange(day, 'enabled', !!checked)} />
                        <Label htmlFor={`enabled-${day}`} className="capitalize font-medium text-base w-24">{day}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                         <Input type="time" id={`start-${day}`} value={availability[day]?.start} onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)} disabled={!availability[day]?.enabled} className="w-32" />
                         <span>-</span>
                         <Input type="time" id={`end-${day}`} value={availability[day]?.end} onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)} disabled={!availability[day]?.enabled} className="w-32" />
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button onClick={handleSaveAvailability} disabled={isSavingAvailability}>
                    {isSavingAvailability && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Availability
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Notifications Section */}
      <Separator />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">Choose how you want to be notified.</p>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardContent className="pt-6">
                <div className="space-y-6">
                    <div>
                        <Label className="font-semibold">Email Notifications</Label>
                        <div className="space-y-3 mt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="notify-appointments" checked={notificationPrefs.appointments} onCheckedChange={(checked) => setNotificationPrefs(p => ({...p, appointments: !!checked}))} />
                                <Label htmlFor="notify-appointments" className="font-normal">New appointment confirmations</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="notify-reschedules" checked={notificationPrefs.reschedules} onCheckedChange={(checked) => setNotificationPrefs(p => ({...p, reschedules: !!checked}))} />
                                <Label htmlFor="notify-reschedules" className="font-normal">Appointment reschedules or cancellations</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="notify-promotions" checked={notificationPrefs.promotions} onCheckedChange={(checked) => setNotificationPrefs(p => ({...p, promotions: !!checked}))} />
                                <Label htmlFor="notify-promotions" className="font-normal">Promotional offers and news</Label>
                            </div>
                        </div>
                    </div>
                     <div>
                        <Label className="font-semibold">Push Notifications</Label>
                        <div className="flex items-center justify-between mt-2">
                            <Label htmlFor="push-all" className="font-normal">Enable all push notifications</Label>
                            <Switch id="push-all" checked={notificationPrefs.pushAll} onCheckedChange={(checked) => setNotificationPrefs(p => ({...p, pushAll: checked}))} />
                        </div>
                     </div>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSaveNotificationPrefs}>Save Preferences</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
       {/* Appearance Section */}
       <Separator />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">Customize the look and feel of the app.</p>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Select a theme for the dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
                <Select onValueChange={setTheme}>
                    <SelectTrigger id="theme">
                        <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
