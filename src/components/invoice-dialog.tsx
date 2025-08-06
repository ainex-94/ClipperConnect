
// src/components/invoice-dialog.tsx
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Printer, FileText } from "lucide-react";
import { Appointment } from "@/lib/firebase/firestore";
import { format } from 'date-fns';

interface InvoiceDialogProps {
  appointment: Appointment;
}

export function InvoiceDialog({ appointment }: InvoiceDialogProps) {
  const [open, setOpen] = useState(false);

  const handlePrint = () => {
    // This is a browser-native print functionality
    window.print();
  };

  const getPaymentStatusVariant = (status?: 'Paid' | 'Unpaid') => {
    return status === 'Paid' ? 'default' : 'destructive';
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <FileText className="mr-2 h-4 w-4" />
          View Invoice
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg print:max-w-full print:border-0 print:shadow-none">
        <div id="invoice-content">
            <DialogHeader>
                <DialogTitle className="text-3xl font-bold">Invoice</DialogTitle>
                <DialogDescription>
                    Invoice ID: {appointment.id}
                </DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h3 className="font-semibold">Bill To</h3>
                    <p>{appointment.customerName}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-semibold">From</h3>
                    <p>{appointment.barberName}</p>
                </div>
                <div>
                    <h3 className="font-semibold">Date Issued</h3>
                    <p>{format(new Date(appointment.dateTime), 'PPP')}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-semibold">Payment Status</h3>
                    <Badge variant={getPaymentStatusVariant(appointment.paymentStatus)}>
                      {appointment.paymentStatus || 'N/A'}
                    </Badge>
                </div>
            </div>
            <Separator className="my-4" />
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>{appointment.service}</TableCell>
                        <TableCell className="text-right">PKR {appointment.price?.toLocaleString()}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <Separator className="my-4" />
            <div className="flex justify-end">
                <div className="grid gap-2 text-right">
                    <div className="flex justify-between items-center gap-4">
                        <span className="font-semibold">Subtotal:</span>
                        <span>PKR {appointment.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        <span className="font-semibold">Amount Paid:</span>
                        <span>PKR {appointment.amountPaid?.toLocaleString() || '0'}</span>
                    </div>
                     <div className="flex justify-between items-center gap-4 text-lg font-bold border-t pt-2 mt-2">
                        <span className="font-semibold">Total Due:</span>
                        <span>
                            PKR {(appointment.paymentStatus === 'Paid' ? 0 : appointment.price || 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
            <Separator className="my-4" />
            <div className="text-center text-xs text-muted-foreground">
                Thank you for your business!
            </div>
        </div>
        <DialogFooter className="print:hidden">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
