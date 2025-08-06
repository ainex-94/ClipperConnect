
// src/app/chat/page.tsx
import { ChatLayout } from "@/components/chat/chat-layout";
import { getChats } from "@/lib/firebase/firestore";
import { getCurrentUser } from "@/lib/firebase/auth-actions";
import { redirect } from "next/navigation";

interface ChatPageProps {
  searchParams?: {
    chatId?: string;
  };
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect('/login');
    }
    
    const chats = await getChats(currentUser.uid);

    return (
      <main className="h-full">
        <ChatLayout 
            chats={chats} 
            defaultChatId={searchParams?.chatId} 
        />
      </main>
    )
}
