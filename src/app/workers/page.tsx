
// src/app/workers/page.tsx
'use client';

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWorkersForBarber, UserProfile } from "@/lib/firebase/firestore";
import { MoreHorizontal, Loader2, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { AddWorkerDialog } from "@/components/add-worker-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { removeWorker } from "../actions";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";


export default function WorkersPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [workers, setWorkers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [workerToDelete, setWorkerToDelete] = useState<UserProfile | null>(null);

    const fetchWorkers = useCallback(async () => {
        if (user) {
            setLoading(true);
            const workerData = await getWorkersForBarber(user.uid);
            setWorkers(workerData);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
      if (user?.role === 'barber' && !user.shopOwnerId) {
        fetchWorkers();
      } else {
        setLoading(false);
      }
    }, [user, fetchWorkers]);
    
    const handleRemoveWorker = async () => {
        if (!workerToDelete) return;

        setIsDeleting(true);
        const result = await removeWorker(workerToDelete.id);
        
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Success', description: result.success });
            fetchWorkers(); // Refresh the list
        }
        
        setIsDeleting(false);
        setWorkerToDelete(null);
    }

    if (!user || user.role !== 'barber' || user.shopOwnerId) {
        return (
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">You do not have permission to view this page. This section is for shop owners.</p>
            </CardContent>
          </Card>
        );
    }
    
    const columns: ColumnDef<UserProfile>[] = [
      {
        accessorKey: 'displayName',
        header: 'Name',
        cell: ({ row }) => (
          <Link href={`/workers/${row.original.id}`} className="flex items-center gap-3 group">
            <Avatar>
              <AvatarImage data-ai-hint="person portrait" src={row.original.photoURL} />
              <AvatarFallback>{row.original.displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <span className="font-medium group-hover:underline">{row.original.displayName}</span>
          </Link>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'specialty',
        header: 'Specialty',
        cell: ({ row }) => row.original.specialty || 'N/A'
      },
      {
        accessorKey: 'workerStatus',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.workerStatus || 'Available';
            return <Badge variant={status === 'Busy' ? 'destructive' : 'default'}>{status}</Badge>;
        }
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const worker = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem onSelect={() => setWorkerToDelete(worker)} className="text-destructive">
                       <Trash2 className="mr-2 h-4 w-4" />
                       Remove
                     </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }
      }
    ];

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Workers Management</CardTitle>
                        <CardDescription>Add and manage the workers in your shop.</CardDescription>
                    </div>
                    <AddWorkerDialog shopOwnerId={user.uid} onSuccess={fetchWorkers} />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={workers}
                            filterColumn="displayName"
                            filterPlaceholder="Filter by worker name..."
                            emptyState="No workers found. Add your first worker to get started."
                        />
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!workerToDelete} onOpenChange={(isOpen) => !isOpen && setWorkerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove <span className="font-bold">{workerToDelete?.displayName}</span> from your shop. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveWorker} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
