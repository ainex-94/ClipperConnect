
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Contact,
  Settings,
  Scissors,
  LogOut,
  LogIn,
  MessageSquare,
  Shield,
  UserCog,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "../ui/button";

const allMenuItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ['admin', 'barber', 'customer'] },
  { href: "/appointments", label: "Appointments", icon: Calendar, roles: ['admin', 'barber', 'customer'] },
  { href: "/barbers", label: "Barbers", icon: Users, roles: ['admin', 'customer'] },
  { href: "/customers", label: "Customers", icon: Contact, roles: ['admin', 'barber'] },
  { href: "/chat", label: "Chat", icon: MessageSquare, roles: ['admin', 'barber', 'customer'] },
  { href: "/user-management", label: "User Management", icon: UserCog, roles: ['admin'] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ['admin', 'barber', 'customer'] },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = allMenuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold font-headline text-primary-dark">ClipperConnect</h1>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {user ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage data-ai-hint="person" src={user.photoURL || 'https://placehold.co/100x100.png'} alt={user.displayName || 'User'} />
              <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold">{user.displayName || "User"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button onClick={logout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <Button asChild variant="outline" className="w-full">
             <Link href="/login">
                <LogIn className="mr-2 h-4 w-4"/>
                <span>Login</span>
            </Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
