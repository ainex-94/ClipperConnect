
// src/hooks/use-notification.tsx
"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useAuth } from "./use-auth";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { type Notification } from "@/lib/firebase/firestore";
import { markAllNotificationsAsRead, markNotificationAsRead } from "@/app/actions";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loadingNotifications: boolean;
  triggerNotificationSound: () => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  useEffect(() => {
    if (user) {
      setLoadingNotifications(true);
      const notificationsRef = collection(db, "users", user.uid, "notifications");
      const q = query(notificationsRef, orderBy("timestamp", "desc"), limit(50));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate().toISOString() || new Date().toISOString()
        } as Notification));
        setNotifications(fetchedNotifications);
        setLoadingNotifications(false);
      }, (error) => {
        console.error("Error fetching notifications:", error);
        setLoadingNotifications(false);
      });

      return () => unsubscribe();
    } else {
      setNotifications([]);
      setLoadingNotifications(false);
    }
  }, [user]);

  const notificationSound = useMemo(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio("https://actions.google.com/sounds/v1/events/notification_simple.ogg");
      audio.volume = 0.3;
      return audio;
    }
    return null;
  }, []);

  const triggerNotificationSound = useCallback(() => {
    notificationSound?.play().catch(error => {
      console.log("Notification sound autoplay prevented:", error);
    });
  }, [notificationSound]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    await markNotificationAsRead({ userId: user.uid, notificationId });
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (!user || unreadCount === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await markAllNotificationsAsRead({ userId: user.uid });
  }, [user, unreadCount]);

  const value = {
    notifications,
    unreadCount,
    loadingNotifications,
    triggerNotificationSound,
    markAsRead,
    markAllAsRead,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
