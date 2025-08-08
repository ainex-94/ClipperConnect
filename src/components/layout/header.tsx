
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, LogIn, LogOut, Coins, Bell, CheckCheck, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { NewAppointmentDialog } from "../new-appointment-dialog";
import { useNotification } from "@/hooks/use-notification";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ViewNotificationDialog } from "../view-notification-dialog";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead, loadingNotifications } = useNotification();

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
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                {unreadCount}
                            </span>
                        )}
                        <span className="sr-only">Notifications</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel className="flex items-center justify-between">
                        Notifications
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto px-2 py-1 text-xs">
                                <CheckCheck className="mr-1 h-3 w-3" />
                                Mark all as read
                            </Button>
                        )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-[300px]">
                        <DropdownMenuGroup>
                            {loadingNotifications ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <ViewNotificationDialog key={notif.id} notification={notif}>
                                        <div className="flex items-start gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
                                            {!notif.read && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5" />}
                                            <div className="grid gap-1 flex-1 pl-2">
                                                <p className="text-sm font-medium leading-none">{notif.title}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{notif.description}</p>
                                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}</p>
                                            </div>
                                        </div>
                                    </ViewNotificationDialog>
                                ))
                            ) : (
                                <p className="text-sm text-center text-muted-foreground py-16">No notifications yet.</p>
                            )}
                        </DropdownMenuGroup>
                    </ScrollArea>
                </DropdownMenuContent>
            </DropdownMenu>

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
                <Link href="/settings"><DropdownMenuItem>Profile</DropdownMenuItem></Link>
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
