// src/components/start-chat-button.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getOrCreateChat } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface StartChatButtonProps {
  otherUserId: string;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | null | undefined;
  size?: "default" | "sm" | "lg" | "icon" | null | undefined;
  asIcon?: boolean;
}

export function StartChatButton({ otherUserId, className, variant="outline", size="sm", asIcon = false }: StartChatButtonProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartChat = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card/row click events
    if (!user) return;
    setIsLoading(true);
    try {
      const chatId = await getOrCreateChat(user.uid, otherUserId);
      const chatUrl = `/chat?chatId=${chatId}`;
      router.push(chatUrl);
    } catch (error) {
      console.error("Failed to start chat:", error);
      // Optionally show a toast message here
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!user || user.uid === otherUserId) {
    return null;
  }

  if (asIcon) {
     return (
        <Button onClick={handleStartChat} disabled={isLoading} variant={variant} size="icon" className={className}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            <span className="sr-only">Start Chat</span>
        </Button>
     )
  }

  return (
    <Button onClick={handleStartChat} disabled={isLoading} variant={variant} size={size} className={cn("w-full", className)}>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="mr-2 h-4 w-4" />
      )}
      Chat
    </Button>
  );
}
