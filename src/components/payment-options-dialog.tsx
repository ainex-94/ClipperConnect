// src/components/payment-options-dialog.tsx
"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useNotification } from "@/hooks/use-notification";
import { Appointment } from "@/lib/firebase/firestore";
import { payFromWallet, recordGatewayPayment } from "@/app/actions";
import { Separator } from "./ui/separator";
import { JazzcashIcon } from "./icons/jazzcash-icon";
import { EasypaisaIcon } from "./icons/easypaisa-icon";

interface PaymentOptionsDialogProps {
  appointment: Appointment;
  onSuccess: () => void;
}

export function PaymentOptionsDialog({ appointment, onSuccess }: PaymentOptionsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerNotificationSound } = useNotification();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handlePayFromWallet = async () => {
    setIsLoading("wallet");
    const result = await payFromWallet({ appointmentId: appointment.id });
    if (result.success) {
      toast({ title: 'Success', description: result.success });
      triggerNotificationSound();
      onSuccess();
      setOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Payment Failed', description: result.error });
    }
    setIsLoading(null);
  };

  const handleGatewayPayment = async (method: 'JazzCash' | 'EasyPaisa') => {
    setIsLoading(method);
    // Simulate API call and processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = await recordGatewayPayment({ appointmentId: appointment.id, paymentMethod: method });
    
    if (result.success) {
      toast({ title: 'Success', description: `Payment with ${method} was successful!` });
      triggerNotificationSound();
      onSuccess();
      setOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Payment Failed', description: result.error });
    }
    setIsLoading(null);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay Now
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            To pay for your appointment with {appointment.barberName} for PKR {appointment.price?.toLocaleString()}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
            <Button
                size="lg"
                onClick={handlePayFromWallet}
                disabled={!!isLoading}
                className="justify-start"
            >
                {isLoading === 'wallet' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                Pay from Wallet (Balance: PKR {user?.walletBalance?.toLocaleString() || 0})
            </Button>

            <div className="relative my-2">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 top-[-13px] bg-background px-2 text-xs text-muted-foreground">OR</span>
            </div>
            
             <Button
                size="lg"
                variant="outline"
                onClick={() => handleGatewayPayment('JazzCash')}
                disabled={!!isLoading}
                className="justify-start"
            >
                {isLoading === 'JazzCash' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <JazzcashIcon className="mr-2 h-6 w-6" />}
                Pay with JazzCash
            </Button>

             <Button
                size="lg"
                variant="outline"
                onClick={() => handleGatewayPayment('EasyPaisa')}
                disabled={!!isLoading}
                className="justify-start"
            >
                {isLoading === 'EasyPaisa' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <EasypaisaIcon className="mr-2 h-6 w-6" />}
                Pay with EasyPaisa
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    