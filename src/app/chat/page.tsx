
// src/app/chat/page.tsx
"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import { getChats } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { redirect, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { type Chat } from "@/lib/firebase/firestore";

export default function ChatPage() {
    const { user } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const chatId = searchParams.get('chatId');
    
    useEffect(() => {
        async function fetchData() {
            if (user) {
              setLoading(true);
              const userChats = await getChats(user.uid);
              setChats(userChats);
              setLoading(false);
            }
        }
        fetchData();
    }, [user]);


    if (loading) {
        return <div className="flex h-full items-center justify-center">Loading chats...</div>;
    }

    return (
      <main className="flex h-full flex-col">
        <ChatLayout 
            chats={chats} 
            defaultChatId={chatId || undefined}
        />
      </main>
    )
}
