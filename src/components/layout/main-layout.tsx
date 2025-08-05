
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
    // This effect runs only when loading is finished.
    if (!loading) {
      // If no user is logged in and they are on a protected route, redirect to login.
      if (!user && !isPublicRoute) {
        router.push('/login');
      }
      // If a user is logged in and they are on a public route, redirect to the dashboard.
      if (user && isPublicRoute) {
        router.push('/');
      }
    }
  }, [user, loading, router, pathname, isPublicRoute]);
  
  // While loading, show a full-screen spinner to prevent any rendering or navigation.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // After loading, if the route is public and there's no user, show the public page (login/register).
  if (isPublicRoute && !user) {
    return <div className="min-h-screen w-full">{children}</div>;
  }
  
  // If there's a user, show the main application layout.
  // This also handles the case of a protected route after the user is confirmed.
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

  // In the brief moment between loading and the redirect for unauthenticated users,
  // show a spinner to prevent the protected route from flashing.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
