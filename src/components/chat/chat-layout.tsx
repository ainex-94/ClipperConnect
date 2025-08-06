
// src/components/chat/chat-layout.tsx
"use client";

import { useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { ChatList } from "./chat-list";
import { ChatWindow } from "./chat-window";
import { type Chat } from "@/lib/firebase/firestore";
import { useRouter } from "next/navigation";

interface ChatLayoutProps {
    chats: Chat[];
    defaultChatId?: string;
}

export function ChatLayout({ chats: initialChats, defaultChatId }: ChatLayoutProps) {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (defaultChatId) {
            const defaultChat = initialChats.find(chat => chat.id === defaultChatId);
            if (defaultChat) {
                setSelectedChat(defaultChat);
            }
        }
    }, [defaultChatId, initialChats]);

    const handleChatSelect = (chat: Chat) => {
        setSelectedChat(chat);
        router.push(`/chat?chatId=${chat.id}`, { scroll: false });
    };


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
                <ChatWindow chat={selectedChat} />
            </div>
        </div>
    );
}
