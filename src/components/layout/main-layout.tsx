
"use client";

import AppSidebar from "@/components/layout/sidebar";
import AppHeader from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const PUBLIC_ROUTES = ['/login', '/register'];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      // Don't do anything while loading. Let the loader show.
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    
    if (!user && !isPublicRoute) {
      // If not authenticated and not on a public route, redirect to login.
      router.push('/login');
    }

    if (user && isPublicRoute) {
      // If authenticated and on a public route (like login), redirect to dashboard.
      router.push('/');
    }

  }, [user, loading, pathname, router]);


  if (loading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }
  
  // If we are on a public route and not loading, show the page content.
  if (PUBLIC_ROUTES.includes(pathname)) {
      return <>{children}</>;
  }
  
  // If we have a user and are not on a public route, show the main layout.
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

  // If none of the above conditions are met (e.g., no user on a protected route,
  // during the brief moment before the useEffect redirect kicks in), show a loader.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
