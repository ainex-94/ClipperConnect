
// src/app/chat/page.tsx
"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import { getChats } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/auth-actions";
import { redirect, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { type Chat } from "@/lib/firebase/firestore";

export default function ChatPage() {
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const chatId = searchParams.get('chatId');
    
    // Fetching user and chats on the client to ensure this component can use hooks.
    useEffect(() => {
        async function fetchData() {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                redirect('/login');
                return;
            }
            const userChats = await getChats(currentUser.uid);
            setChats(userChats);
            setLoading(false);
        }
        fetchData();
    }, []);


    if (loading) {
        return <div className="flex h-full items-center justify-center">Loading chats...</div>;
    }

    return (
      <main className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-7rem)]">
        <ChatLayout 
            chats={chats} 
            defaultChatId={chatId || undefined}
        />
      </main>
    )
}
