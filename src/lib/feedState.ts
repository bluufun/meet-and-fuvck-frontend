"use client";

interface Funmate {
  _id: string; name: string; username: string; age?: number; lga?: string; state?: string;
  boostTier: "regular" | "fresher" | "elite" | "elite_plus"; isVerified?: boolean;
  mediaUrls: string[]; experiences?: string[]; vibeBio?: string; currentWant?: string;
}

export interface FeedState {
  tab: string;
  filterKey: string;
  selectedId?: string | null;
  funmates: Funmate[];
  idx: number;
  hasMore: boolean;
  page: number;
  savedAt: number; // Date.now() at save time — lets us tell how stale signed mediaUrls are
}

const STORAGE_KEY = "bf_feed_state";

export function saveFeedState(s: Omit<FeedState, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, savedAt: Date.now() }));
  } catch {
    // storage full/unavailable — not critical, just skip
  }
}

export function getFeedState(filterKey: string): FeedState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: FeedState = JSON.parse(raw);
    if (parsed.filterKey !== filterKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFeedState() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function clearFeedStateIfOlderThan(maxAgeMs: number) {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed: FeedState = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > maxAgeMs) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}











// "use client";

// interface Funmate {
//   _id: string; name: string; username: string; age?: number; lga?: string; state?: string;
//   boostTier: "regular" | "fresher" | "elite" | "elite_plus"; isVerified?: boolean;
//   mediaUrls: string[]; experiences?: string[]; vibeBio?: string; currentWant?: string;
// }

// export interface FeedState {
//   tab: string;
//   filterKey: string;
//   funmates: Funmate[];
//   idx: number;
//   hasMore: boolean;
//   page: number;
//   savedAt: number; // Date.now() at save time — lets us tell how stale signed mediaUrls are
// }

// const STORAGE_KEY = "bf_feed_state";

// export function saveFeedState(s: Omit<FeedState, "savedAt">) {
//   if (typeof window === "undefined") return;
//   try {
//     sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, savedAt: Date.now() }));
//   } catch {
//     // storage full/unavailable — not critical, just skip
//   }
// }

// export function getFeedState(filterKey: string): FeedState | null {
//   if (typeof window === "undefined") return null;
//   try {
//     const raw = sessionStorage.getItem(STORAGE_KEY);
//     if (!raw) return null;
//     const parsed: FeedState = JSON.parse(raw);
//     if (parsed.filterKey !== filterKey) return null;
//     return parsed;
//   } catch {
//     return null;
//   }
// }

// export function clearFeedState() {
//   if (typeof window === "undefined") return;
//   sessionStorage.removeItem(STORAGE_KEY);
// }
