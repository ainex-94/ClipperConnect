
// src/components/start-end-job-dialog.tsx
"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Play, Square, Loader2 } from "lucide-react";
import { updateAppointmentStatus } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

interface StartEndJobDialogProps {
  appointmentId: string;
  action: "start" | "end";
  onSuccess: () => void;
}

export function StartEndJobDialog({ appointmentId, action, onSuccess }: StartEndJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAction = async () => {
    setIsLoading(true);
    const newStatus = action === 'start' ? 'InProgress' : 'Completed';
    
    const result = await updateAppointmentStatus({ appointmentId, status: newStatus });

    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      toast({ title: "Success", description: `Job successfully ${action === 'start' ? 'started' : 'ended'}.` });
      onSuccess();
      setOpen(false);
    }
    setIsLoading(false);
  };
  
  const triggerText = action === 'start' ? 'Start Job' : 'End Job';
  const dialogTitle = action === 'start' ? 'Start this Job?' : 'End this Job?';
  const dialogDescription = action === 'start' 
    ? "This will mark the appointment as 'In Progress'. Are you sure?"
    : "This will mark the appointment as 'Completed' and ready for payment. Are you sure?";
  const Icon = action === 'start' ? Play : Square;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Icon className="mr-2 h-4 w-4" />
          {triggerText}
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleAction} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
