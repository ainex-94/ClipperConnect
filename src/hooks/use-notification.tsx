
// src/hooks/use-notification.tsx
"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";

interface NotificationContextType {
  hasNotification: boolean;
  triggerNotification: () => void;
  clearNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [hasNotification, setHasNotification] = useState(false);

  // Memoize the Audio object so it's not recreated on every render
  const notificationSound = useMemo(() => {
    // Check if window is defined to prevent SSR errors
    if (typeof window !== "undefined") {
      const audio = new Audio("https://actions.google.com/sounds/v1/events/notification_simple.ogg");
      audio.volume = 0.3; // Set a reasonable volume
      return audio;
    }
    return null;
  }, []);


  const triggerNotification = useCallback(() => {
    setHasNotification(true);
    notificationSound?.play().catch(error => {
      // Autoplay was prevented. This is common if the user hasn't interacted with the page yet.
      console.log("Notification sound autoplay prevented:", error);
    });
  }, [notificationSound]);

  const clearNotification = useCallback(() => {
    setHasNotification(false);
  }, []);
  

  const value = {
    hasNotification,
    triggerNotification,
    clearNotification,
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
