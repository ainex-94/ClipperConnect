
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
import { useNotification } from "@/hooks/use-notification";
import { Textarea } from "./ui/textarea";

interface RateAppointmentDialogProps {
  appointmentId: string;
  userNameToRate: string;
  onSuccess: () => void;
}

export function RateAppointmentDialog({ appointmentId, userNameToRate, onSuccess }: RateAppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const { toast } = useToast();
  const { triggerNotificationSound } = useNotification();

  const handleRate = async () => {
    if (rating === 0) {
      toast({ variant: "destructive", title: "Invalid Rating", description: "Please select a rating from 1 to 5 stars." });
      return;
    }
    
    setIsLoading(true);
    const result = await rateAppointment({ appointmentId, rating, reviewText });

    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      toast({ title: "Success", description: "Your rating has been submitted. Thank you!" });
      onSuccess();
      triggerNotificationSound();
      setOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Star className="mr-2 h-4 w-4" />
          Rate Experience
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How would you rate the service provided by {userNameToRate}?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex justify-center items-center gap-2">
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
             <Textarea
                placeholder="Share your experience... (optional)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
            />
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
