// src/components/assign-worker-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { assignWorkerToAppointment } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Loader2, UserCheck } from "lucide-react";
import { getWorkersForBarber, UserProfile, Appointment } from "@/lib/firebase/firestore";

const formSchema = z.object({
  appointmentId: z.string(),
  newWorkerId: z.string().min(1, "Please select a worker."),
});

interface AssignWorkerDialogProps {
  appointment: Appointment;
  shopOwnerId: string;
  onSuccess: () => void;
}

export function AssignWorkerDialog({ appointment, shopOwnerId, onSuccess }: AssignWorkerDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workers, setWorkers] = useState<UserProfile[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appointmentId: appointment.id,
      newWorkerId: appointment.assignedWorkerId || "",
    },
  });

  useEffect(() => {
    if (open) {
      const fetchWorkers = async () => {
        setIsLoading(true);
        const workerData = await getWorkersForBarber(shopOwnerId);
        setWorkers(workerData);
        setIsLoading(false);
      };
      fetchWorkers();
    }
  }, [open, shopOwnerId]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await assignWorkerToAppointment(values);
    setIsLoading(false);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      });
    } else {
      toast({
        title: "Success",
        description: result.success,
      });
      onSuccess();
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <UserCheck className="mr-2 h-4 w-4" />
          Assign Worker
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Worker</DialogTitle>
          <DialogDescription>
            Assign this appointment to one of your available workers.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="newWorkerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Worker</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isLoading}>
                        <SelectValue placeholder="Select a worker to assign" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id} disabled={worker.workerStatus === 'Busy'}>
                          {worker.displayName} ({worker.workerStatus || 'Available'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Assign
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
