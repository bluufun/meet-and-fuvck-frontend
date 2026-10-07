// hooks/usePwaInstall.ts
"use client";

import { useEffect, useState } from "react";

// sessionStorage is scoped to the current tab and is cleared the moment
// that tab closes — so "dismissed" means "not this session," and a fresh
// visit (new tab, or reopening after closing) always starts clean.
const SESSION_DISMISS_KEY = "bf_pwa_install_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)").matches;
  // iOS Safari's own (non-standard) flag for "already added to home screen"
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const iosStandalone = nav.standalone === true;
  return Boolean(mql || iosStandalone);
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Covers iPhone/iPad/iPod Safari and Chrome/Firefox-on-iOS (all WebKit,
  // all use the same Share -> Add to Home Screen flow since iOS 16.4).
  const isIPad = ua.includes("Macintosh") && navigator.maxTouchPoints > 1; // iPadOS reports as Mac
  return /iPhone|iPad|iPod/.test(ua) || isIPad;
}

function dismissedThisSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
}

export type PwaInstallState = {
  /** Show an Android/Chrome-style install banner with a real install button. */
  canPromptAndroid: boolean;
  /** Show an iOS-style banner with manual "Add to Home Screen" instructions. */
  canPromptIOS: boolean;
  /** Trigger the native Android/Chrome install prompt. */
  promptInstall: () => Promise<void>;
  /** Dismiss whichever banner is showing for the rest of this tab session. */
  dismiss: () => void;
};

export function usePwaInstall(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  // Read-only environment checks — computed once via lazy initial state
  // rather than set from inside an effect body.
  const [dismissed, setDismissed] = useState(() => dismissedThisSession());
  const [alreadyInstalled, setAlreadyInstalled] = useState(() =>
    isStandalone(),
  );
  const [ios] = useState(() => isIOS());

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setDeferredPrompt(null);
      setAlreadyInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const dismiss = () => {
    window.sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    setDismissed(true);
  };

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    // If they explicitly declined the native dialog, don't immediately
    // re-show our banner underneath it — but only for this session.
    if (outcome === "dismissed") dismiss();
  };

  const visible = !alreadyInstalled && !dismissed;

  return {
    canPromptAndroid: visible && Boolean(deferredPrompt),
    canPromptIOS: visible && ios && !deferredPrompt,
    promptInstall,
    dismiss,
  };
}
