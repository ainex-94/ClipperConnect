// src/app/user-management/_components/status-switcher.tsx
"use client";

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { updateUserAccountStatus } from '@/app/actions';
import { UserProfile } from '@/lib/firebase/firestore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StatusSwitcherProps {
    userId: string;
    currentStatus: UserProfile['accountStatus'];
}

export function StatusSwitcher({ userId, currentStatus }: StatusSwitcherProps) {
    const [status, setStatus] = useState(currentStatus);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleStatusChange = async (newStatus: UserProfile['accountStatus']) => {
        setIsLoading(true);
        setStatus(newStatus);
        
        const result = await updateUserAccountStatus({ userId, status: newStatus });

        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Error updating status',
                description: result.error,
            });
            setStatus(currentStatus); // Revert on failure
        } else {
            toast({
                title: 'Status Updated',
                description: result.success,
            });
        }
        setIsLoading(false);
    }
    
    const getStatusVariant = (status: UserProfile['accountStatus']) => {
        switch (status) {
            case "Approved": return "default";
            case "Pending": return "secondary";
            case "Rejected": return "destructive";
            default: return "outline";
        }
    }

    return (
        <Select 
            onValueChange={(value: UserProfile['accountStatus']) => handleStatusChange(value)} 
            value={status} 
            disabled={isLoading}
        >
            <SelectTrigger className="w-[120px] focus:ring-0 focus:ring-offset-0 border-none shadow-none bg-transparent">
                <SelectValue asChild>
                     <Badge variant={getStatusVariant(status)}>{status}</Badge>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
        </Select>
    );
}
