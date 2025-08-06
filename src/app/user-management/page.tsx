
// src/app/user-management/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllUsers, UserProfile } from "@/lib/firebase/firestore";
import { format } from 'date-fns';
import { RoleSwitcher } from "./_components/role-switcher";
import { Loader2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { StatusSwitcher } from "./_components/status-switcher";

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

    const columns: ColumnDef<UserProfile>[] = [
      {
        accessorKey: 'displayName',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage data-ai-hint="person portrait" src={row.original.photoURL} />
              <AvatarFallback>{row.original.displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.original.displayName}</span>
          </div>
        )
      },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => <RoleSwitcher userId={row.original.id} currentRole={row.original.role} />
      },
      {
        accessorKey: 'accountStatus',
        header: 'Status',
        cell: ({ row }) => <StatusSwitcher userId={row.original.id} currentStatus={row.original.accountStatus || 'Pending'} />
      },
      {
        accessorKey: 'createdAt',
        header: 'Member Since',
        cell: ({ row }) => <div className="text-right">{format(new Date(row.original.createdAt), 'PPP')}</div>
      }
    ];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View all users and manage their roles and account status.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
         {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            filterColumn="displayName"
            filterPlaceholder="Filter by user name..."
            emptyState="No users found."
          />
        )}
      </CardContent>
    </Card>
  );
}
