
// src/app/services/page.tsx
'use client';

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServicesForBarber, Service } from "@/lib/firebase/firestore";
import { MoreHorizontal, Loader2, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import { type ColumnDef } from "@tanstack/react-table";
import { ServiceDialog } from "@/components/service-dialog";
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
import { deleteService } from "../actions";
import { Button } from "@/components/ui/button";

export default function ServicesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

    const fetchServices = useCallback(async () => {
        if (user) {
            setLoading(true);
            const serviceData = await getServicesForBarber(user.uid);
            setServices(serviceData);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
      if (user?.role === 'barber' && !user.shopOwnerId) {
        fetchServices();
      } else {
        setLoading(false);
      }
    }, [user, fetchServices]);
    
    const handleDeleteService = async () => {
        if (!serviceToDelete) return;

        setIsDeleting(true);
        const result = await deleteService(serviceToDelete.id);
        
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Success', description: result.success });
            fetchServices();
        }
        
        setIsDeleting(false);
        setServiceToDelete(null);
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
    
    const columns: ColumnDef<Service>[] = [
      {
        accessorKey: 'name',
        header: 'Service Name',
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => row.original.description || <span className="text-muted-foreground">N/A</span>
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        cell: ({ row }) => `${row.original.duration} mins`
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => `PKR ${row.original.price.toLocaleString()}`
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const service = row.original;
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
                     <ServiceDialog
                        barberId={user.uid}
                        onSuccess={fetchServices}
                        service={service}
                        trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Edit
                            </DropdownMenuItem>
                        }
                     />
                     <DropdownMenuItem onSelect={() => setServiceToDelete(service)} className="text-destructive">
                       <Trash2 className="mr-2 h-4 w-4" />
                       Delete
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
                        <CardTitle>Services Management</CardTitle>
                        <CardDescription>Add, edit, and manage the services your shop offers.</CardDescription>
                    </div>
                    <ServiceDialog barberId={user.uid} onSuccess={fetchServices} />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={services}
                            filterColumn="name"
                            filterPlaceholder="Filter by service name..."
                            emptyState="No services found. Add your first service to get started."
                        />
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!serviceToDelete} onOpenChange={(isOpen) => !isOpen && setServiceToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the service <span className="font-bold">{serviceToDelete?.name}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteService} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
