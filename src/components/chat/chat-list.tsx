
// src/components/chat/chat-list.tsx
"use client";

import { useAuth } from "@/hooks/use-auth";
import { type Chat, UserProfile } from "@/lib/firebase/firestore";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { UserPresenceIndicator } from "../user-presence-indicator";
import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onSelect: (chat: Chat) => void;
  currentUserId: string;
}

function ChatListItem({ chat, isSelected, onSelect, currentUserId }: ChatListItemProps) {
  const otherParticipantInfo = chat.participants.find(p => p.id !== currentUserId);
  const [otherParticipant, setOtherParticipant] = useState<UserProfile | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined = undefined;
    if (otherParticipantInfo) {
      const userRef = doc(db, 'users', otherParticipantInfo.id);
      unsub = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setOtherParticipant({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        }
      });
    }
    return () => unsub?.();
  }, [otherParticipantInfo]);

  if (!otherParticipantInfo || !otherParticipant) return null;

  const otherUserIsTyping = chat?.typing?.[otherParticipantInfo.id] || false;

  return (
    <button
      onClick={() => onSelect(chat)}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted",
        isSelected && "bg-muted"
      )}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
            <AvatarImage data-ai-hint="person portrait" src={otherParticipantInfo.photoURL} />
            <AvatarFallback>{otherParticipantInfo.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <UserPresenceIndicator presence={otherParticipant.presence} className="absolute bottom-0 right-0 border-2 border-background" />
      </div>
      <div className="flex-1 truncate">
        <div className="font-semibold">{otherParticipantInfo.displayName}</div>
        {otherUserIsTyping ? (
           <p className="text-sm text-primary truncate animate-pulse">
              typing...
          </p>
        ) : (
          <p className="text-sm text-muted-foreground truncate">
            {chat.lastMessage?.text || "No messages yet"}
          </p>
        )}
      </div>
    </button>
  );
}


interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onChatSelect: (chat: Chat) => void;
}

export function ChatList({ chats, selectedChat, onChatSelect }: ChatListProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <ChatListItem 
                key={chat.id}
                chat={chat}
                isSelected={selectedChat?.id === chat.id}
                onSelect={onChatSelect}
                currentUserId={user.uid}
            />
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
              No conversations yet. Start one from a barber's profile!
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
