
// src/hooks/use-notification.tsx
"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";

interface NotificationContextType {
  hasNotification: boolean;
  triggerNotification: () => void;
  clearNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [hasNotification, setHasNotification] = useState(false);

  const triggerNotification = useCallback(() => {
    setHasNotification(true);
  }, []);

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
