
// src/components/chat/chat-window.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { type Chat, type Message, sendMessage } from "@/lib/firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { collection, query, orderBy, onSnapshot, doc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send, ArrowLeft, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { markMessagesAsRead, updateUserTypingStatus } from "@/app/actions";
import { useDebounce } from "@/hooks/use-debounce";
import { MessageStatus } from "./message-status";

interface ChatWindowProps {
  chat: Chat | null;
  isMobile?: boolean;
  onBack?: () => void;
}

export function ChatWindow({ chat, isMobile, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const otherParticipant = chat?.participants.find(p => p.id !== user?.uid);
  const otherUserIsTyping = chat?.typing?.[otherParticipant?.id || ""] || false;

  const debouncedTyping = useDebounce(() => {
    if (chat && user) {
        updateUserTypingStatus({ chatId: chat.id, userId: user.uid, isTyping: false });
    }
  }, 2000);

  useEffect(() => {
    if (chat && user) {
      // Mark messages as read when chat is opened
      markMessagesAsRead({ chatId: chat.id, currentUserId: user.uid });
      
      const chatRef = doc(db, 'chats', chat.id);
      const messagesQuery = query(
        collection(db, "chats", chat.id, "messages"),
        orderBy("timestamp", "asc")
      );

      const unsubscribeMessages = onSnapshot(messagesQuery, (querySnapshot) => {
        const msgs = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id } as Message));
        setMessages(msgs);
      });
      
      // Separate listener for the chat document itself (for typing status)
      const unsubscribeChat = onSnapshot(chatRef, (docSnap) => {
        if (docSnap.exists()) {
            const chatData = docSnap.data() as Chat;
            // You can update the chat state here if needed, e.g., for typing indicators
            // For now, we get the typing status directly from the `chat` prop which should be updated by the parent
        }
      });

      return () => {
        unsubscribeMessages();
        unsubscribeChat();
        // Ensure typing status is set to false when component unmounts
        if (isTyping) {
            updateUserTypingStatus({ chatId: chat.id, userId: user.uid, isTyping: false });
        }
      };
    }
  }, [chat, user, isTyping]);


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
    if (newMessage.trim() === "" || !chat || !user || !otherParticipant) return;
    
    // Optimistic UI update: clear the input field immediately
    const messageToSend = newMessage;
    setNewMessage("");

    // Perform the async operations in the background
    try {
        await sendMessage(chat.id, user.uid, otherParticipant.id, messageToSend);
        await updateUserTypingStatus({ chatId: chat.id, userId: user.uid, isTyping: false });
        setIsTyping(false);
    } catch (error) {
        console.error("Failed to send message:", error);
        // Optionally, handle the error, e.g., show a toast and restore the input
        setNewMessage(messageToSend); 
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (chat && user) {
        if (!isTyping) {
            updateUserTypingStatus({ chatId: chat.id, userId: user.uid, isTyping: true });
            setIsTyping(true);
        }
        debouncedTyping();
    }
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
        <div className="flex flex-col">
            <h2 className="text-lg font-bold">{otherParticipant?.displayName}</h2>
            {otherUserIsTyping && <p className="text-xs text-primary animate-pulse">typing...</p>}
        </div>
      </header>
      
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="p-4 space-y-2">
            {messages.map((msg, index) => (
            <div
                key={msg.id || index}
                className={cn("flex items-end gap-2 max-w-lg md:max-w-xl", {
                "justify-start": msg.senderId !== user.uid,
                "justify-end ml-auto": msg.senderId === user.uid,
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
                    "rounded-xl p-3 px-4 shadow-sm",
                    {
                    "bg-primary text-primary-foreground rounded-br-none": msg.senderId === user.uid,
                    "bg-muted text-foreground rounded-bl-none": msg.senderId !== user.uid,
                    }
                )}
                >
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.senderId === user.uid && (
                    <MessageStatus status={msg.status} />
                )}
            </div>
            ))}
         </div>
      </ScrollArea>

      <footer className="border-t p-4 shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={handleInputChange}
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
