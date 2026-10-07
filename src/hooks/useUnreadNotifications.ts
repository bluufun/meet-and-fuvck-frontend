"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function useUnreadNotifications() {
  const { user, loading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || authLoading) {
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const data = await api.notifications.unreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user || authLoading) return;

    const timer = window.setInterval(() => {
      void refresh();
    }, 60000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [authLoading, refresh, user]);

  return {
    unreadCount,
    loading,
    refresh,
  };
}
