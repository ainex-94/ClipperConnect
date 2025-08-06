// src/app/user-management/page.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/firebase/auth-actions";
import { getAllUsers, UserProfile } from "@/lib/firebase/firestore";
import { format } from 'date-fns';
import { redirect } from "next/navigation";
import { RoleSwitcher } from "./_components/role-switcher";

export default async function UserManagementPage() {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }
    
    if (user.role !== 'admin') {
      redirect('/');
    }
    const users: UserProfile[] = await getAllUsers();

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View all users and manage their roles.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
