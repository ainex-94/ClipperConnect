
"use client";

import AppSidebar from "@/components/layout/sidebar";
import AppHeader from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const PUBLIC_ROUTES = ['/login', '/register'];

function AccessDeniedScreen({ status }: { status: 'Pending' | 'Rejected' }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    {status === 'Pending' ? <ShieldAlert className="mx-auto h-12 w-12 text-yellow-500" /> : <UserX className="mx-auto h-12 w-12 text-destructive" />}
                    <CardTitle className="mt-4">
                        {status === 'Pending' ? "Account Pending Approval" : "Account Rejected"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription>
                        {status === 'Pending' 
                            ? "Your account is currently under review by our administrators. You will be notified once a decision has been made. Thank you for your patience."
                            : "Unfortunately, your account has not been approved. If you believe this is a mistake, please contact our support team."
                        }
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    )
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // If we are on a public route, show the page content without the main layout.
  if (PUBLIC_ROUTES.includes(pathname)) {
      return <>{children}</>;
  }

  if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }
  
  // If user is logged in but not approved, show the relevant screen
  if (user && user.accountStatus !== 'Approved') {
      return <AccessDeniedScreen status={user.accountStatus || 'Pending'} />;
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
