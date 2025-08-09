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
} from "@/components/ui/dialog";
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

type PaymentMethod = 'Wallet' | 'JazzCash' | 'EasyPaisa';

interface PaymentOptionsDialogProps {
  appointment: Appointment;
  onSuccess: () => void;
}

export function PaymentOptionsDialog({ appointment, onSuccess }: PaymentOptionsDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { triggerNotificationSound } = useNotification();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<PaymentMethod | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState<PaymentMethod | null>(null);

  const handlePaymentExecution = async () => {
    if (!confirmingPayment) return;
    
    setIsLoading(confirmingPayment);

    let result: { success?: string; error?: string };

    if (confirmingPayment === 'Wallet') {
      result = await payFromWallet({ appointmentId: appointment.id });
    } else {
      // Simulate API call and processing time for gateways
      await new Promise(resolve => setTimeout(resolve, 2000));
      result = await recordGatewayPayment({ appointmentId: appointment.id, paymentMethod: confirmingPayment });
    }

    if (result.success) {
      toast({ title: 'Success', description: result.success || `Payment with ${confirmingPayment} was successful!` });
      triggerNotificationSound();
      onSuccess();
      setOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Payment Failed', description: result.error });
    }
    
    setIsLoading(null);
    setConfirmingPayment(null);
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setConfirmingPayment(method);
  }

  return (
    <>
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
                  onClick={() => handlePaymentMethodSelect('Wallet')}
                  disabled={!!isLoading}
                  className="justify-start"
              >
                  {isLoading === 'Wallet' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                  Pay from Wallet (Balance: PKR {user?.walletBalance?.toLocaleString() || 0})
              </Button>

              <div className="relative my-2">
                  <Separator />
                  <span className="absolute left-1/2 -translate-x-1/2 top-[-13px] bg-background px-2 text-xs text-muted-foreground">OR</span>
              </div>
              
              <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handlePaymentMethodSelect('JazzCash')}
                  disabled={!!isLoading}
                  className="justify-start gap-2"
              >
                  {isLoading === 'JazzCash' ? <Loader2 className="h-5 w-5 animate-spin" /> : <JazzcashIcon className="h-6 w-6" />}
                  <span className="flex-1 text-left">Pay with JazzCash</span>
              </Button>

              <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handlePaymentMethodSelect('EasyPaisa')}
                  disabled={!!isLoading}
                  className="justify-start gap-2"
              >
                  {isLoading === 'EasyPaisa' ? <Loader2 className="h-5 w-5 animate-spin" /> : <EasypaisaIcon className="h-6 w-6" />}
                  <span className="flex-1 text-left">Pay with EasyPaisa</span>
              </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!confirmingPayment} onOpenChange={(isOpen) => !isOpen && setConfirmingPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to pay PKR {appointment.price?.toLocaleString()} using {confirmingPayment}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePaymentExecution} disabled={!!isLoading}>
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm & Pay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
