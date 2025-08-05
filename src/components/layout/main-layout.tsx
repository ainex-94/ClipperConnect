
"use client";

import AppSidebar from "@/components/layout/sidebar";
import AppHeader from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ['/login', '/register'];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    // Don't do anything while auth state is loading
    if (loading) {
      return;
    }

    // If user is logged in and tries to access a public route, redirect to dashboard
    if (user && isPublicRoute) {
      router.push('/');
    }

    // If user is not logged in and tries to access a protected route, redirect to login
    if (!user && !isPublicRoute) {
      router.push('/login');
    }
  }, [user, loading, router, isPublicRoute, pathname]);
  
  // While authentication is in progress, show a global loader and nothing else.
  // This is the key to preventing the render loop.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If we're on a public route and not logged in, render the public page (login/register).
  if (!user && isPublicRoute) {
    return <div className="min-h-screen w-full">{children}</div>;
  }
  
  // If we have a user and are on a protected route, show the main application layout.
  if (user && !isPublicRoute) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <AppHeader />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // In any other case (like waiting for redirect), show a loader.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
