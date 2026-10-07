// lib/visitorPresence.ts
"use client";

import { getVisitorId } from "./visitorPing";

// How often we tear down and reopen the connection with a fresh token from
// localStorage. EventSource reconnects automatically on drops/errors, but
// it won't notice a login/logout that happens mid-connection — this keeps
// the server-side identity (logged-in userId vs anonymous session) from
// drifting stale for too long after the user signs in or out.
const IDENTITY_REFRESH_MS = 4 * 60 * 1000;

export function startVisitorPresence() {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  let source: EventSource | null = null;
  let refreshTimer: ReturnType<typeof setInterval> | null = null;
  let stopped = false;

  const connect = () => {
    if (stopped || typeof window === "undefined" || !("EventSource" in window)) {
      return;
    }

    source?.close();

    const token = localStorage.getItem("bf_token");
    const params = new URLSearchParams({ sessionId: getVisitorId() });
    if (token) params.set("token", token);

    source = new EventSource(`${API}/api/visitors/live?${params.toString()}`);

    // No explicit onerror handling needed beyond this: EventSource retries
    // the connection on its own after a drop, using the browser's default
    // backoff. We just let it keep trying quietly in the background.
    source.onerror = () => {
      // swallow — native reconnect handles it
    };
  };

  connect();
  refreshTimer = setInterval(connect, IDENTITY_REFRESH_MS);

  return () => {
    stopped = true;
    if (refreshTimer) clearInterval(refreshTimer);
    source?.close();
  };
}