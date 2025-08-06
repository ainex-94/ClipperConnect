
// src/components/enter-payment-dialog.tsx
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2 } from "lucide-react";
import { Appointment } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { recordPayment } from "@/app/actions";
import { useNotification } from "@/hooks/use-notification";

interface EnterPaymentDialogProps {
  appointment: Appointment;
  onSuccess: () => void;
}

export function EnterPaymentDialog({ appointment, onSuccess }: EnterPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(appointment.price?.toString() || "");
  const { toast } = useToast();
  const { triggerNotification } = useNotification();

  const handleSavePayment = async () => {
    setIsLoading(true);
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount < 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid positive number." });
      setIsLoading(false);
      return;
    }

    const result = await recordPayment({ appointmentId: appointment.id, amountPaid: numericAmount });

    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      toast({ title: "Success", description: "Payment recorded successfully." });
      onSuccess();
      triggerNotification();
      setOpen(false);
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <DollarSign className="mr-2 h-4 w-4" />
          Enter Payment
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Enter the amount paid by the customer for this service. Service price was PKR {appointment.price?.toLocaleString()}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount (PKR)
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 2200"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSavePayment} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
