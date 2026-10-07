"use client";
import { useEffect } from "react";
import { startVisitorPing } from "@/lib/visitorPing";
import { startVisitorPresence } from "@/lib/visitorPresence";

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const stopPing = startVisitorPing();
    const stopPresence = startVisitorPresence();
    return () => {
      stopPing();
      stopPresence();
    };
  }, []);

  useEffect(() => {
    // Service worker registration is one of the technical requirements for
    // Chrome/Android to consider the site installable as a PWA. Guarded so
    // it's a no-op in dev/unsupported browsers rather than a hard error.
    if (
      process.env.NODE_ENV === "production" &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — the site works fine without it, it just won't be
        // installable on Android in that case.
      });
    }
  }, []);

  return <>{children}</>;
}
