
// src/components/user-presence-indicator.tsx
"use client";

import { UserProfile } from "@/lib/firebase/firestore";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { formatDistanceToNow } from "date-fns";

interface UserPresenceIndicatorProps {
    presence?: UserProfile['presence'];
    className?: string;
}

export function UserPresenceIndicator({ presence, className }: UserPresenceIndicatorProps) {
    const isOnline = presence?.status === 'online';
    
    let tooltipContent = "Status unknown";
    if (presence) {
        if (isOnline) {
            tooltipContent = "Online";
        } else {
            tooltipContent = `Offline - last seen ${formatDistanceToNow(new Date(presence.lastSeen), { addSuffix: true })}`;
        }
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn("relative flex h-3 w-3", className)}>
                        <div className={cn(
                            "absolute inline-flex h-full w-full rounded-full opacity-75",
                             isOnline ? "bg-green-400 animate-ping" : ""
                        )} />
                        <div className={cn(
                            "relative inline-flex rounded-full h-3 w-3",
                            isOnline ? "bg-green-500" : "bg-gray-400"
                        )} />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipContent}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
