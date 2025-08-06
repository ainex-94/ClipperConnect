
// src/components/chat/chat-layout.tsx
"use client";

import { useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { ChatList } from "./chat-list";
import { ChatWindow } from "./chat-window";
import { type Chat } from "@/lib/firebase/firestore";

interface ChatLayoutProps {
    chats: Chat[];
    defaultChatId?: string;
}

export function ChatLayout({ chats: initialChats, defaultChatId }: ChatLayoutProps) {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

    useEffect(() => {
        if (defaultChatId) {
            const defaultChat = initialChats.find(chat => chat.id === defaultChatId);
            if (defaultChat) {
                setSelectedChat(defaultChat);
            }
        } else if (initialChats.length > 0 && !selectedChat) {
            // Optionally select the first chat if none is selected
            // setSelectedChat(initialChats[0]);
        }
    }, [defaultChatId, initialChats, selectedChat]);


    return (
        <div className="flex h-[calc(100vh-10rem)] w-full -m-4 sm:-m-6 lg:-m-8">
            <Sidebar className="w-full max-w-xs border-r">
                <SidebarHeader className="p-4">
                    <h2 className="text-xl font-bold">Conversations</h2>
                </SidebarHeader>
                <SidebarContent>
                    <ChatList
                        chats={initialChats}
                        selectedChat={selectedChat}
                        onChatSelect={setSelectedChat}
                    />
                </SidebarContent>
            </Sidebar>
            <div className="flex-1">
                <ChatWindow chat={selectedChat} />
            </div>
        </div>
    );
}
