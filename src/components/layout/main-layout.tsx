
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
    if (loading) {
      return; // Wait until loading is complete before doing any redirects
    }

    // If we have a user and they are on a public route (e.g., /login), redirect to home
    if (user && isPublicRoute) {
      router.push('/');
    }

    // If we don't have a user and they are on a protected route, redirect to login
    if (!user && !isPublicRoute) {
      router.push('/login');
    }
  }, [user, loading, router, isPublicRoute, pathname]);
  
  // While authentication is in progress, show a loader.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If on a public route and no user, show the public page (login/register).
  if (isPublicRoute && !user) {
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

  // In any other case (like redirecting), show a loader to prevent screen flicker.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
