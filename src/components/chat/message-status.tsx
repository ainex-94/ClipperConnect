
// src/components/chat/message-status.tsx
"use client";

import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Message } from "@/lib/firebase/firestore";

interface MessageStatusProps {
    status: Message['status'];
}

export function MessageStatus({ status }: MessageStatusProps) {
    if (status === 'read') {
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }
    return <Check className="h-4 w-4 text-muted-foreground" />;
}
