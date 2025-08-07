// src/components/chat/chat-layout.tsx
"use client";

import { useState, useEffect } from "react";
import { ChatList } from "./chat-list";
import { ChatWindow } from "./chat-window";
import { type Chat } from "@/lib/firebase/firestore";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
    chats: Chat[];
    defaultChatId?: string;
}

export function ChatLayout({ chats: initialChats, defaultChatId }: ChatLayoutProps) {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const router = useRouter();
    const isMobile = useIsMobile();

    useEffect(() => {
        if (defaultChatId) {
            const defaultChat = initialChats.find(chat => chat.id === defaultChatId);
            if (defaultChat) {
                setSelectedChat(defaultChat);
            }
        } else if (initialChats.length > 0 && !isMobile) {
            // Select the first chat by default on desktop
            setSelectedChat(initialChats[0]);
        }
    }, [defaultChatId, initialChats, isMobile]);

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
        <div className="relative h-full w-full bg-card overflow-hidden">
             <div className={cn(
                "absolute top-0 left-0 w-full h-full transition-transform duration-300 ease-in-out md:static md:w-1/3 lg:w-1/4 md:border-r md:transform-none",
                selectedChat && isMobile ? "-translate-x-full" : "translate-x-0"
             )}>
                <div className="flex flex-col h-full">
                    <header className="p-4 border-b">
                        <h2 className="text-xl font-bold">Conversations</h2>
                    </header>
                    <ChatList
                        chats={initialChats}
                        selectedChat={selectedChat}
                        onChatSelect={handleChatSelect}
                    />
                </div>
            </div>
             <div className={cn(
                "absolute top-0 left-0 w-full h-full transition-transform duration-300 ease-in-out md:static md:flex-1 md:transform-none",
                selectedChat && isMobile ? "translate-x-0" : "translate-x-full"
            )}>
                 <ChatWindow 
                    chat={selectedChat} 
                    onBack={handleBack} 
                    isMobile={isMobile} 
                    key={selectedChat?.id} // Add key to force re-render on chat change
                />
            </div>
        </div>
    );
}
