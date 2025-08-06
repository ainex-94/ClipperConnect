
"use client";

import AppSidebar from "@/components/layout/sidebar";
import AppHeader from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { UserProfile } from "@/lib/firebase/firestore";

const PUBLIC_ROUTES = ['/login', '/register'];
const REDIRECT_PATH_KEY = 'redirectPath';

export default function MainLayout({
  children,
  serverUser
}: {
  children: React.ReactNode;
  serverUser: UserProfile | null;
}) {
  const { user: clientUser, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // The user state is determined by the server first, then updated by the client.
  // This avoids the flicker of showing a logged-out state initially.
  const user = clientUser ?? serverUser;
  
  // We use this state to prevent layout shifts/flickering on initial load.
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Once the client-side auth state is resolved, the initial load is complete.
    if (!loading) {
      setIsInitialLoad(false);
    }
  }, [loading]);
  
  useEffect(() => {
    // Don't run router logic until the client has hydrated and auth state is confirmed.
    if (isInitialLoad) {
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    
    // If not authenticated and trying to access a protected route, redirect to login.
    if (!user && !isPublicRoute) {
      sessionStorage.setItem(REDIRECT_PATH_KEY, pathname);
      router.push('/login');
    }

  }, [user, isInitialLoad, pathname, router]);

  // While the client is loading its auth state, show a full-page loader.
  // This prevents the redirect logic from firing prematurely.
  if (isInitialLoad) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }
  
  // If we are on a public route, show the page content without the main layout.
  if (PUBLIC_ROUTES.includes(pathname)) {
      return <>{children}</>;
  }
  
  // If we have a user and are on a protected route, show the main application layout.
  if (user) {
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

  // If on a protected route and there is no user (after initial load),
  // show a loader while the redirect to /login happens.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
