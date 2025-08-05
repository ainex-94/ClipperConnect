
// src/app/chat/page.tsx
import { ChatLayout } from "@/components/chat/chat-layout";
import { getChats } from "@/lib/firebase/firestore";
import { auth } from "@/lib/firebase/firebase";

export default async function ChatPage() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        // Or redirect to login
        return <div className="p-8">Please log in to view your chats.</div>;
    }
    
    const chats = await getChats(currentUser.uid);

    return (
        <main className="flex h-[calc(100dvh_-_4rem)] flex-col">
            <ChatLayout chats={chats} />
        </main>
    )
}
