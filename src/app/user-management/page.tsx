// src/app/user-management/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllUsers, UserProfile } from "@/lib/firebase/firestore";
import { format } from 'date-fns';
import { RoleSwitcher } from "./_components/role-switcher";
import { Loader2 } from "lucide-react";

export default function UserManagementPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const allUsers = await getAllUsers();
            setUsers(allUsers);
            setLoading(false);
        };
        if (user?.role === 'admin') {
          fetchUsers();
        } else {
          setLoading(false);
        }
    }, [user]);
    
    if (user?.role !== 'admin') {
      return (
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      );
    }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View all users and manage their roles.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
         {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Member Since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((listUser) => (
              <TableRow key={listUser.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage data-ai-hint="person portrait" src={listUser.photoURL} />
                      <AvatarFallback>{listUser.displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{listUser.displayName}</span>
                  </div>
                </TableCell>
                <TableCell>{listUser.email}</TableCell>
                <TableCell>
                    <RoleSwitcher userId={listUser.id} currentRole={listUser.role} />
                </TableCell>
                <TableCell className="text-right">{format(new Date(listUser.createdAt), 'PPP')}</TableCell>
              </TableRow>
            ))}
             {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
