
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
import { Loader2, Camera, Upload, Trash2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadImage } from "@/lib/firebase/storage";
import Image from "next/image";

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    bio: ""
  });
  const [availability, setAvailability] = useState<Record<string, { start: string; end: string; enabled: boolean }>>({});
  const [shopImageUrls, setShopImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const shopPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        email: user.email || "",
        bio: user.bio || "" 
      });

      if (user.role === 'barber') {
        const fetchUserData = async () => {
           const userRef = doc(db, "users", user.uid);
           const docSnap = await getDoc(userRef);
           if (docSnap.exists()) {
             const userData = docSnap.data();
             setFormData(prev => ({...prev, bio: userData.bio || ""}));
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
           setLoading(false);
        };
        fetchUserData();
      } else {
        setLoading(false);
      }
    }
  }, [user]);
  
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    
    setIsUploading(true);
    const file = event.target.files[0];
    const path = `profile_pictures/${user.uid}`;

    try {
      const photoURL = await uploadImage(file, path);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { photoURL });
      await refreshUser(); // Refresh user data from auth context
      toast({ title: "Success", description: "Profile picture updated." });
    } catch (error) {
      console.error("Error uploading profile picture: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to upload image." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleShopPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    setIsUploading(true);
    const file = event.target.files[0];
    const path = `shop_photos/${user.uid}/${Date.now()}_${file.name}`;

    try {
      const imageUrl = await uploadImage(file, path);
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        shopImageUrls: arrayUnion(imageUrl)
      });
      setShopImageUrls(prev => [...prev, imageUrl]);
      toast({ title: "Success", description: "Shop photo added." });
    } catch (error)
 {
      console.error("Error uploading shop photo: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to upload shop photo." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteShopPhoto = async (imageUrl: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        shopImageUrls: arrayRemove(imageUrl)
      });
      setShopImageUrls(prev => prev.filter(url => url !== imageUrl));
      // Note: This does not delete the file from Firebase Storage to keep it simple.
      toast({ title: "Success", description: "Shop photo removed." });
    } catch (error) {
       console.error("Error deleting shop photo: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to remove shop photo." });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  const handleAvailabilityChange = (day: string, field: 'start' | 'end' | 'enabled', value: string | boolean) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSaveChanges = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to save changes." });
      return;
    }
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updateData: any = {
        displayName: formData.displayName.trim(),
        email: formData.email,
        bio: formData.bio,
      };

      if (user.role === 'barber') {
        updateData.availability = {};
        daysOfWeek.forEach(day => {
          if (availability[day]?.enabled) {
            updateData.availability[day] = {
              start: availability[day].start,
              end: availability[day].end,
            };
          } else {
             updateData.availability[day] = null;
          }
        });
      }
      
      await updateDoc(userRef, updateData);
      await refreshUser(); // Refresh user data to update display name everywhere
      toast({ title: "Success", description: "Profile updated successfully." });
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  }
  
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
                    <input
                      type="file"
                      ref={profilePicInputRef}
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      accept="image/*"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background"
                      onClick={() => profilePicInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={formData.displayName} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" placeholder="Tell us a little about yourself." value={formData.bio} onChange={handleInputChange} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleSaveChanges} disabled={loading || isUploading}>
                {(loading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {user.role === 'barber' && (
        <>
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
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteShopPhoto(url)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                     <div className="aspect-square flex items-center justify-center border-2 border-dashed rounded-md">
                        <input
                          type="file"
                          ref={shopPhotoInputRef}
                          onChange={handleShopPhotoUpload}
                          className="hidden"
                          accept="image/*"
                          disabled={isUploading}
                        />
                        <Button variant="outline" size="icon" onClick={() => shopPhotoInputRef.current?.click()} disabled={isUploading}>
                           {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                        </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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
                        <Checkbox 
                          id={`enabled-${day}`} 
                          checked={availability[day]?.enabled}
                          onCheckedChange={(checked) => handleAvailabilityChange(day, 'enabled', !!checked)}
                        />
                        <Label htmlFor={`enabled-${day}`} className="capitalize font-medium text-base w-24">{day}</Label>
                      </div>
                      <div className="flex items-center gap-2">
                         <Input
                          type="time"
                          id={`start-${day}`}
                          value={availability[day]?.start}
                          onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                          disabled={!availability[day]?.enabled}
                          className="w-32"
                         />
                         <span>-</span>
                         <Input
                          type="time"
                          id={`end-${day}`}
                          value={availability[day]?.end}
                          onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                          disabled={!availability[day]?.enabled}
                          className="w-32"
                         />
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button onClick={handleSaveChanges} disabled={loading || isUploading}>
                    {(loading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Availability
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </>
      )}

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
                                <Checkbox id="notify-appointments" defaultChecked />
                                <Label htmlFor="notify-appointments" className="font-normal">New appointment confirmations</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="notify-reschedules" />
                                <Label htmlFor="notify-reschedules" className="font-normal">Appointment reschedules or cancellations</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="notify-promotions" defaultChecked />
                                <Label htmlFor="notify-promotions" className="font-normal">Promotional offers and news</Label>
                            </div>
                        </div>
                    </div>
                     <div>
                        <Label className="font-semibold">Push Notifications</Label>
                        <div className="flex items-center justify-between mt-2">
                            <Label htmlFor="push-all" className="font-normal">Enable all push notifications</Label>
                            <Switch id="push-all" defaultChecked />
                        </div>
                     </div>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
       <Separator />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">Customize the look and feel of the app.</p>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                     <Select defaultValue="system">
                        <SelectTrigger id="theme">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
              </div>
            </CardContent>
             <CardFooter className="border-t px-6 py-4">
              <Button>Update Theme</Button>
            </CardFooter>
          </Card>
        </div>
      </div>

    </div>
  );
}
