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
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";


export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const nameParts = user.displayName?.split(" ") || ["", ""];
      setFormData({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" "),
        email: user.email || "",
        // Fetch bio from firestore if available, for now it's empty
        bio: "" 
      });
      setLoading(false);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  const handleSaveChanges = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to save changes." });
      return;
    }
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        // you would save other fields like 'bio' here as well
      });
      toast({ title: "Success", description: "Profile updated successfully." });
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  }
  
  if (loading && !user) {
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
          <p className="text-sm text-muted-foreground">Update your personal information.</p>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={formData.firstName} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={formData.lastName} onChange={handleInputChange} />
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
              <Button onClick={handleSaveChanges} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
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
