
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

    // This height calculation ensures the chat layout fills the vertical space
    // without causing the main page to scroll. It accounts for the header height and main padding.
    // lg:h-[calc(100vh_-_8rem)] is for large screens (main padding p-8 = 2rem * 2 = 4rem, header h-16 = 4rem)
    // h-[calc(100vh_-_7rem)] is for smaller screens (main padding p-4/p-6, header h-16)
    return (
      <div className="h-[calc(100vh_-_7rem)] lg:h-[calc(100vh_-_8rem)]">
        <ChatLayout 
            chats={chats} 
            defaultChatId={searchParams?.chatId} 
        />
      </div>
    )
}
