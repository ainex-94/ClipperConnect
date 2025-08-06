
// src/components/rate-appointment-dialog.tsx
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
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { rateAppointment } from "@/app/actions";
import { cn } from "@/lib/utils";

interface RateAppointmentDialogProps {
  appointmentId: string;
  ratedUserId: string;
  ratingField: 'barberRating' | 'customerRating';
  userNameToRate: string;
  onSuccess: () => void;
}

export function RateAppointmentDialog({ appointmentId, ratedUserId, ratingField, userNameToRate, onSuccess }: RateAppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const { toast } = useToast();

  const handleRate = async () => {
    if (rating === 0) {
      toast({ variant: "destructive", title: "Invalid Rating", description: "Please select a rating from 1 to 5 stars." });
      return;
    }
    
    setIsLoading(true);
    const result = await rateAppointment({ appointmentId, ratedUserId, rating, ratingField });

    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      toast({ title: "Success", description: "Your rating has been submitted. Thank you!" });
      onSuccess();
      setOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Star className="mr-2 h-4 w-4" />
          Rate {ratingField === 'barberRating' ? 'Barber' : 'Customer'}
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How would you rate the service provided by {userNameToRate}?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center py-4 gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-10 w-10 cursor-pointer transition-colors",
                (hoverRating >= star || rating >= star)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              )}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            />
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleRate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
