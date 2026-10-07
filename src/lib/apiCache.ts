"use client";

interface Entry<T> {
  data: T;
  ts: number;
}

const store = new Map<string, Entry<any>>();
const DEFAULT_TTL = 4 * 60 * 1000;
const MAX_ENTRIES = 100;

function pruneCache() {
  if (store.size <= MAX_ENTRIES) return;

  const overflow = store.size - MAX_ENTRIES;
  const oldest = Array.from(store.entries())
    .sort((a, b) => a[1].ts - b[1].ts)
    .slice(0, overflow);

  oldest.forEach(([key]) => {
    store.delete(key);
  });
}

export function getCachedData<T>(key: string, ttl = DEFAULT_TTL): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttl) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCachedData<T>(key: string, data: T) {
  store.set(key, { data, ts: Date.now() });
  pruneCache();
}

export function invalidateCache(prefix?: string) {
  if (!prefix) return store.clear();
  Array.from(store.keys()).forEach((k) => k.startsWith(prefix) && store.delete(k));
}

// Call this whenever a user's own data changes in a way that could be
// reflected elsewhere: their own detail page + any landing feed page that
// might be holding a stale copy of them.
export function invalidateUserEverywhere(username?: string) {
  if (username) invalidateCache(`funmate:${username}`);
  invalidateCache("landing:");
}
