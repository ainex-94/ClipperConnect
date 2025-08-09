
// src/components/chat/chat-layout.tsx
"use client";

import { useState, useEffect } from "react";
import { ChatList } from "./chat-list";
import { ChatWindow } from "./chat-window";
import { type Chat } from "@/lib/firebase/firestore";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

interface ChatLayoutProps {
    chats: Chat[];
    defaultChatId?: string;
}

export function ChatLayout({ chats: initialChats, defaultChatId }: ChatLayoutProps) {
    const [chats, setChats] = useState(initialChats);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const router = useRouter();
    const isMobile = useIsMobile();

    useEffect(() => {
        // Update local chats state when the initial prop changes
        setChats(initialChats);
    }, [initialChats]);

    useEffect(() => {
        const unsubscribers = chats.map(chat => {
            const chatRef = doc(db, 'chats', chat.id);
            return onSnapshot(chatRef, (docSnap) => {
                if (docSnap.exists()) {
                    const updatedChat = { id: docSnap.id, ...docSnap.data() } as Chat;
                    setChats(prevChats => 
                        prevChats.map(c => c.id === updatedChat.id ? updatedChat : c)
                    );
                    // Also update the selectedChat if it's the one that changed
                    setSelectedChat(prevSelChat => 
                        prevSelChat?.id === updatedChat.id ? updatedChat : prevSelChat
                    );
                }
            });
        });
        return () => unsubscribers.forEach(unsub => unsub());
    }, [chats]);


    useEffect(() => {
        if (defaultChatId) {
            const defaultChat = chats.find(chat => chat.id === defaultChatId);
            if (defaultChat) {
                setSelectedChat(defaultChat);
            }
        } else if (chats.length > 0 && !isMobile) {
            // Select the first chat by default on desktop
            setSelectedChat(chats[0]);
        }
    }, [defaultChatId, chats, isMobile]);

    const handleChatSelect = (chat: Chat) => {
        setSelectedChat(chat);
        if (!isMobile) {
          router.push(`/chat?chatId=${chat.id}`, { scroll: false });
        }
    };
    
    const handleBack = () => {
        setSelectedChat(null);
    }

    return (
        <div className="relative flex h-full w-full bg-card overflow-hidden">
             <div className={cn(
                "transition-transform duration-300 ease-in-out",
                "w-full md:w-1/3 lg:w-1/4 md:border-r",
                isMobile && selectedChat ? "absolute -translate-x-full" : "static translate-x-0"
             )}>
                <div className="flex flex-col h-full">
                    <header className="p-4 border-b shrink-0">
                        <h2 className="text-xl font-bold">Conversations</h2>
                    </header>
                    <ChatList
                        chats={chats}
                        selectedChat={selectedChat}
                        onChatSelect={handleChatSelect}
                    />
                </div>
            </div>
             <div className={cn(
                "transition-transform duration-300 ease-in-out flex-1",
                 isMobile ? (selectedChat ? "absolute inset-0 translate-x-0" : "absolute inset-0 translate-x-full") : "static"
            )}>
                 <ChatWindow 
                    chat={selectedChat} 
                    onBack={handleBack} 
                    isMobile={isMobile} 
                    key={selectedChat?.id}
                />
            </div>
        </div>
    );
}
