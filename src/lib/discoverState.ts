"use client";

import type { DiscoverFunmate } from "@/components/discover/types";
import type { DiscoverFilterState } from "@/components/discover/DiscoverFilterDrawer";

// Remembers where someone was on the "/" discover grid (active tab, filters,
// every page of cards loaded so far, and the scroll offset) so that coming
// back from a funmate profile drops them exactly where they left off, instead
// of remounting at the top with only the first page of results.
//
// Mirrors lib/feedState.ts (used by the swipe feed), but for a scrolling grid:
// the list snapshot and the scroll offset live under separate keys so the
// high-frequency scroll writes stay tiny and never re-serialise the list.

export interface DiscoverSnapshot {
  tabId: "all" | "newest" | "elite_plus" | "elite" | "near_me";
  filters: DiscoverFilterState;
  funmates: DiscoverFunmate[];
  hasMore: boolean;
  page: number;
  nearMeState: string | null;
  query?: string;
  // When the OLDEST cards in this list were fetched. Media URLs are signed
  // and expire, so this (not the save time) decides whether the snapshot is
  // still safe to show.
  loadedAt: number;
}

const STATE_KEY = "bf_discover_state";
const SCROLL_KEY = "bf_discover_scroll";

// Signed media URLs last ~1h; stay well inside that window.
const MAX_AGE_MS = 30 * 60 * 1000;

function isHardReload(): boolean {
  if (typeof performance === "undefined") return false;
  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (nav) return nav.type === "reload";
  // Fallback for older browsers without Navigation Timing L2
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (performance as any).navigation?.type === 1;
}

// Module-level so a later in-app remount isn't mistaken for a page reload:
// the navigation entry keeps saying "reload" until the next document load.
let hasCheckedHardReload = false;

export function clearDiscoverState() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(SCROLL_KEY);
  } catch {
    // storage unavailable — nothing to clear
  }
}

export function saveDiscoverState(s: DiscoverSnapshot) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STATE_KEY, JSON.stringify(s));
  } catch {
    // storage full/unavailable — not critical, just skip
  }
}

export function saveDiscoverScroll(y: number) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SCROLL_KEY, String(Math.max(0, Math.round(y))));
  } catch {
    // not critical
  }
}

/**
 * Returns the saved grid snapshot and scroll offset, or null when the visit
 * should start fresh (nothing saved, snapshot too old, or a hard refresh).
 */
export function readDiscoverState(): {
  snapshot: DiscoverSnapshot;
  scrollY: number;
} | null {
  if (typeof window === "undefined") return null;

  // A genuine reload (F5 / reload button) always starts from the top.
  if (!hasCheckedHardReload) {
    hasCheckedHardReload = true;
    if (isHardReload()) {
      clearDiscoverState();
      return null;
    }
  }

  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const snapshot: DiscoverSnapshot = JSON.parse(raw);
    if (
      !Array.isArray(snapshot.funmates) ||
      snapshot.funmates.length === 0 ||
      !snapshot.loadedAt ||
      Date.now() - snapshot.loadedAt > MAX_AGE_MS
    ) {
      clearDiscoverState();
      return null;
    }
    const scrollY = Number(sessionStorage.getItem(SCROLL_KEY)) || 0;
    return { snapshot, scrollY };
  } catch {
    clearDiscoverState();
    return null;
  }
}
