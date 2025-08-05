
// src/components/chat/chat-list.tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { type Chat } from "@/lib/firebase/firestore";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
}

export function ChatList({ chats, selectedChat, onChatSelect }: ChatListProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-1 p-2">
      {chats.length > 0 ? (
        chats.map((chat) => {
          const otherParticipant = chat.participants.find(p => p.id !== user.uid);
          return (
            <button
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent",
                selectedChat?.id === chat.id && "bg-accent"
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage data-ai-hint="person portrait" src={otherParticipant?.photoURL} />
                <AvatarFallback>{otherParticipant?.displayName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <div className="font-semibold">{otherParticipant?.displayName}</div>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.lastMessage?.text || "No messages yet"}
                </p>
              </div>
            </button>
          );
        })
      ) : (
        <div className="p-4 text-center text-muted-foreground">
            No conversations yet.
        </div>
      )}
    </div>
  );
}
