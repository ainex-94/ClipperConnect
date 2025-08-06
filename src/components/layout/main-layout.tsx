
"use client";

import AppSidebar from "@/components/layout/sidebar";
import AppHeader from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

const PUBLIC_ROUTES = ['/login', '/register'];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // If we are on a public route, show the page content without the main layout.
  if (PUBLIC_ROUTES.includes(pathname)) {
      return <>{children}</>;
  }
  
  // For all other routes, show the main application layout.
  // The header and sidebar will adapt based on the user's auth state.
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
