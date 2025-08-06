
// src/components/chat/chat-window.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { type Chat, type Message, sendMessage } from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  chat: Chat | null;
}

export function ChatWindow({ chat }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (chat) {
      const q = query(
        collection(db, "chats", chat.id, "messages"),
        orderBy("timestamp", "asc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => doc.data() as Message);
        setMessages(msgs);
      });
      return () => unsubscribe();
    }
  }, [chat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !chat || !user) return;
    
    const otherParticipant = chat.participants.find(p => p.id !== user.uid);
    if (!otherParticipant) return;

    await sendMessage(chat.id, user.uid, otherParticipant.id, newMessage);
    setNewMessage("");
  };

  if (!chat || !user) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a conversation to start chatting.
      </div>
    );
  }

  const otherParticipant = chat.participants.find(p => p.id !== user.uid);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b p-4 flex-shrink-0">
        <Avatar className="h-10 w-10">
            <AvatarImage data-ai-hint="person portrait" src={otherParticipant?.photoURL} />
            <AvatarFallback>{otherParticipant?.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-bold">{otherParticipant?.displayName}</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={cn("flex items-end gap-2", {
              "justify-end": msg.senderId === user.uid,
            })}
          >
            {msg.senderId !== user.uid && (
              <Avatar className="h-8 w-8">
                <AvatarImage data-ai-hint="person portrait" src={otherParticipant?.photoURL} />
                <AvatarFallback>{otherParticipant?.displayName?.[0]}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-xs rounded-lg p-3 lg:max-w-md",
                {
                  "bg-primary text-primary-foreground": msg.senderId === user.uid,
                  "bg-muted": msg.senderId !== user.uid,
                }
              )}
            >
              <p className="text-sm">{msg.text}</p>
            </div>
             {msg.senderId === user.uid && (
              <Avatar className="h-8 w-8">
                <AvatarImage data-ai-hint="person" src={user?.photoURL || ''} />
                <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <footer className="border-t p-4 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
