// src/app/register/page.tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Scissors, User, Briefcase } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";


const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-67.7 67.7C313.6 97.2 282.7 80 248 80c-82.8 0-150.5 67.7-150.5 150.5S165.2 406.5 248 406.5c97.2 0 130.3-72.9 134.8-107.8H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
    </svg>
);


export default function RegisterPage() {
  const { user, loginWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"customer" | "barber">("customer");
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleRegister = () => {
      if (!role) {
          toast({
              variant: "destructive",
              title: "Role not selected",
              description: "Please select a role before registering.",
          })
          return;
      }
      loginWithGoogle(role);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent">
      <Card className="w-full max-w-sm shadow-2xl fade-in-animation">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Scissors className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Create an Account</CardTitle>
          <CardDescription>
            Join ClipperConnect as a customer or a barber.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <RadioGroup defaultValue="customer" onValueChange={(value: "customer" | "barber") => setRole(value)} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="customer" id="customer" className="peer sr-only" />
                <Label
                  htmlFor="customer"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <User className="mb-3 h-6 w-6" />
                  Customer
                </Label>
              </div>
              <div>
                <RadioGroupItem value="barber" id="barber" className="peer sr-only" />
                <Label
                  htmlFor="barber"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Briefcase className="mb-3 h-6 w-6" />
                  Barber
                </Label>
              </div>
            </RadioGroup>

            <Button
              onClick={handleRegister}
              disabled={loading}
              className="w-full"
            >
              <GoogleIcon />
              {loading ? "Registering..." : `Register as ${role === 'customer' ? 'a Customer' : 'a Barber'}`}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
