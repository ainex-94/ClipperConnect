
// src/components/chat/chat-layout.tsx
"use client";

import { useState } from "react";
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { ChatList } from "./chat-list";
import { ChatWindow } from "./chat-window";
import { type Chat } from "@/lib/firebase/firestore";

interface ChatLayoutProps {
    chats: Chat[];
}

export function ChatLayout({ chats: initialChats }: ChatLayoutProps) {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

    return (
        <div className="flex h-full w-full">
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
