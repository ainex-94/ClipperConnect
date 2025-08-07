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
import { Send, ArrowLeft, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";

interface ChatWindowProps {
  chat: Chat | null;
  isMobile?: boolean;
  onBack?: () => void;
}

export function ChatWindow({ chat, isMobile, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat) {
      const q = query(
        collection(db, "chats", chat.id, "messages"),
        orderBy("timestamp", "asc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id } as Message));
        setMessages(msgs);
      });
      return () => unsubscribe();
    }
  }, [chat]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: "smooth"
        });
    }
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
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground p-8 text-center">
        <MessageSquare className="h-16 w-16 mb-4 text-muted-foreground/50"/>
        <h2 className="text-xl font-semibold">Select a Conversation</h2>
        <p className="text-sm">Choose one of your existing conversations to continue chatting.</p>
      </div>
    );
  }

  const otherParticipant = chat.participants.find(p => p.id !== user.uid);

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex items-center gap-4 border-b p-4 shrink-0">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
            <AvatarImage data-ai-hint="person portrait" src={otherParticipant?.photoURL} />
            <AvatarFallback>{otherParticipant?.displayName?.[0]}</AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-bold">{otherParticipant?.displayName}</h2>
      </header>
      
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4 space-y-6">
            {messages.map((msg) => (
            <div
                key={msg.id}
                className={cn("flex items-end gap-2", {
                "justify-start": msg.senderId !== user.uid,
                "justify-end": msg.senderId === user.uid,
                })}
            >
                {msg.senderId !== user.uid && (
                <Avatar className="h-8 w-8 self-start">
                    <AvatarImage data-ai-hint="person portrait" src={otherParticipant?.photoURL} />
                    <AvatarFallback>{otherParticipant?.displayName?.[0]}</AvatarFallback>
                </Avatar>
                )}
                <div
                className={cn(
                    "max-w-xs md:max-w-md lg:max-w-lg rounded-xl p-3 px-4 shadow-sm",
                    {
                    "bg-primary text-primary-foreground rounded-br-none": msg.senderId === user.uid,
                    "bg-muted text-foreground rounded-bl-none": msg.senderId !== user.uid,
                    }
                )}
                >
                <p className="text-sm break-words">{msg.text}</p>
                </div>
                {msg.senderId === user.uid && (
                <Avatar className="h-8 w-8 self-start">
                    <AvatarImage data-ai-hint="person" src={user?.photoURL || ''} />
                    <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
                </Avatar>
                )}
            </div>
            ))}
         </div>
      </ScrollArea>

      <footer className="border-t p-4 shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            className="h-12 text-base"
          />
          <Button type="submit" size="icon" className="h-12 w-12 rounded-full">
            <Send className="h-5 w-5" />
            <span className="sr-only">Send Message</span>
          </Button>
        </form>
      </footer>
    </div>
  );
}
