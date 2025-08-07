// src/components/chat/chat-layout.tsx
"use client";

import { useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
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
        } else {
            // On mobile, if no chat is selected, ensure we don't show an empty window
            if (isMobile) {
                setSelectedChat(null);
            }
        }
    }, [defaultChatId, initialChats, isMobile]);

    const handleChatSelect = (chat: Chat) => {
        setSelectedChat(chat);
        // Only update URL on desktop to avoid weird back button behavior on mobile
        if (!isMobile) {
          router.push(`/chat?chatId=${chat.id}`, { scroll: false });
        }
    };
    
    const handleBack = () => {
        setSelectedChat(null);
    }

    if (isMobile) {
        return (
            <div className="flex flex-col h-full bg-card">
                {selectedChat ? (
                    <ChatWindow chat={selectedChat} onBack={handleBack} isMobile={isMobile} />
                ) : (
                    <>
                        <header className="p-4 border-b">
                            <h2 className="text-xl font-bold">Conversations</h2>
                        </header>
                         <ChatList
                            chats={initialChats}
                            selectedChat={selectedChat}
                            onChatSelect={handleChatSelect}
                        />
                    </>
                )}
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] border rounded-lg overflow-hidden bg-card">
            <Sidebar className="w-full max-w-xs border-r">
                <SidebarHeader className="p-4">
                    <h2 className="text-xl font-bold">Conversations</h2>
                </SidebarHeader>
                <SidebarContent>
                    <ChatList
                        chats={initialChats}
                        selectedChat={selectedChat}
                        onChatSelect={handleChatSelect}
                    />
                </SidebarContent>
            </Sidebar>
            <div className="flex-1 flex flex-col">
                <ChatWindow chat={selectedChat} isMobile={isMobile} />
            </div>
        </div>
    );
}
