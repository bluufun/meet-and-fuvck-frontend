// lib/visitorPing.ts
"use client";

export function getVisitorId(): string {
  let id = localStorage.getItem("bf_vid");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("bf_vid", id);
  }
  return id;
}

export function startVisitorPing() {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const send = () => {
    const token = localStorage.getItem("bf_token");
    fetch(`${API}/api/visitors/ping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sessionId: getVisitorId() }),
      keepalive: true, // survives tab-close-in-flight
    }).catch(() => {});
  };

  send();
  const id = setInterval(send, 60_000); // every 60s
  return () => clearInterval(id);
}
