
// src/components/view-notification-dialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { type Notification } from "@/lib/firebase/firestore";
import { useNotification } from "@/hooks/use-notification";
import Link from "next/link";
import { format } from "date-fns";

interface ViewNotificationDialogProps {
  notification: Notification;
  children: React.ReactNode;
}

export function ViewNotificationDialog({ notification, children }: ViewNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const { markAsRead } = useNotification();

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{notification.title}</DialogTitle>
          <DialogDescription>
            {format(new Date(notification.timestamp), "PPP p")}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <p className="py-4 text-sm">{notification.description}</p>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          {notification.href && (
            <Button asChild>
              <Link href={notification.href}>View Details</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
