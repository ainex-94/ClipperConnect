// src/app/user-management/_components/role-switcher.tsx
"use client";

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { updateUserRole } from '@/app/actions';
import { UserProfile } from '@/lib/firebase/firestore';

interface RoleSwitcherProps {
    userId: string;
    currentRole: UserProfile['role'];
}

export function RoleSwitcher({ userId, currentRole }: RoleSwitcherProps) {
    const [role, setRole] = useState(currentRole);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleRoleChange = async (newRole: UserProfile['role']) => {
        setIsLoading(true);
        setRole(newRole);
        
        const result = await updateUserRole({ userId, role: newRole });

        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Error updating role',
                description: result.error,
            });
            setRole(currentRole); // Revert on failure
        } else {
            toast({
                title: 'Role Updated',
                description: `User role has been changed to ${newRole}.`,
            });
        }
        setIsLoading(false);
    }

    return (
        <Select 
            onValueChange={(value: UserProfile['role']) => handleRoleChange(value)} 
            value={role} 
            disabled={isLoading}
        >
            <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="barber">Barber</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
        </Select>
    );
}
