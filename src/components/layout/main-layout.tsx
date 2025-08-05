
"use client";

import AppSidebar from "@/components/layout/sidebar";
import AppHeader from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

const PUBLIC_ROUTES = ['/login', '/register'];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // For debugging, we are temporarily disabling all session checks and redirects.
  // This will render the content based on whether it's a "public" page style or the main app layout.

  if (isPublicRoute) {
      // Render public routes like login/register without the main layout
      return <>{children}</>;
  }

  // Render all other routes with the main app layout (sidebar, header, etc.)
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
