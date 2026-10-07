// hooks/useAdminLivePresence.ts
"use client";

import { useEffect, useRef, useState } from "react";

// The presence-stream token minted by the backend expires after 10 minutes
// (see getAdminPresenceStreamToken). We reconnect a bit before that so the
// stream never has a chance to go dark waiting on an expired token.
const TOKEN_REFRESH_MS = 8 * 60 * 1000;

/**
 * Subscribes to the live "people on the site right now" count pushed by
 * /api/presence/admin-stream. Returns null until the first event arrives,
 * so callers can fall back to the last known snapshot from /api/admin/stats
 * in the meantime.
 */
export function useAdminLivePresence(enabled: boolean) {
  const [count, setCount] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || !("EventSource" in window)) return;

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setInterval> | null = null;

    async function connect() {
      try {
        const res = await fetch(`${API}/api/admin/presence/stream-token`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
          },
        });
        if (!res.ok || cancelled) return;
        const { token } = await res.json();
        if (cancelled || !token) return;

        sourceRef.current?.close();
        const source = new EventSource(
          `${API}/api/presence/admin-stream?token=${encodeURIComponent(token)}`,
        );
        sourceRef.current = source;

        source.addEventListener("presence", (event) => {
          try {
            const data = JSON.parse((event as MessageEvent).data);
            if (typeof data.count === "number") setCount(data.count);
          } catch {
            // ignore malformed event
          }
        });
        source.onopen = () => setConnected(true);
        source.onerror = () => setConnected(false);
      } catch {
        // network hiccup — the scheduled retry below will pick it back up
      }
    }

    connect();
    refreshTimer = setInterval(connect, TOKEN_REFRESH_MS);

    return () => {
      cancelled = true;
      if (refreshTimer) clearInterval(refreshTimer);
      sourceRef.current?.close();
      setConnected(false);
    };
  }, [enabled]);

  return { count, connected };
}
