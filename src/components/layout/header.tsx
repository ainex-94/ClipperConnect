
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, LogIn, LogOut, Coins, Bell } from "lucide-react";
import { Input } from "../ui/input";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { NewAppointmentDialog } from "../new-appointment-dialog";
import { useNotification } from "@/hooks/use-notification";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { hasNotification, clearNotification } = useNotification();

  const handleNotificationClick = () => {
    // In a real app, this would open a notification panel.
    // For now, it just clears the indicator.
    clearNotification();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <SidebarTrigger className="md:hidden" />

      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search appointments, customers..."
          className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-500">
              <Coins className="h-5 w-5" />
              <span>{(user.coins || 0).toLocaleString()}</span>
            </div>
            
            <Button variant="ghost" size="icon" className="relative" onClick={handleNotificationClick}>
              <Bell className="h-5 w-5" />
              {hasNotification && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>

            <NewAppointmentDialog />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage data-ai-hint="person" src={user.photoURL || "https://placehold.co/100x100.png"} alt={user.displayName || "User"} />
                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <Link href="/billing"><DropdownMenuItem>Billing</DropdownMenuItem></Link>
                <Link href="/settings"><DropdownMenuItem>Settings</DropdownMenuItem></Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
