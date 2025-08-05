// src/components/view-schedule-dialog.tsx
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
} from "@/components/ui/dialog";
import { UserProfile } from "@/lib/firebase/firestore";
import { CalendarDays } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "./ui/badge";

interface ViewScheduleDialogProps {
  barber: UserProfile;
}

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function ViewScheduleDialog({ barber }: ViewScheduleDialogProps) {
  const [open, setOpen] = useState(false);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
            <CalendarDays className="mr-2 h-4 w-4"/>
            View Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Weekly Schedule for {barber.displayName}</DialogTitle>
          <DialogDescription>
            Here are the regular working hours.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {daysOfWeek.map(day => {
                        const schedule = barber.availability?.[day];
                        return (
                             <TableRow key={day}>
                                <TableCell className="capitalize font-medium">{day}</TableCell>
                                <TableCell className="text-right">
                                    {schedule ? (
                                        <span>{formatTime(schedule.start)} - {formatTime(schedule.end)}</span>
                                    ) : (
                                        <Badge variant="secondary">Off Duty</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
