"use client";
import { useEffect, useState } from "react";
import { mediaCache } from "./mediaCache";


// Forces a re-render whenever a preload finishes, so components pick up
// the new (cached) src without needing to re-fetch anything themselves.
export function useMediaCacheVersion() {
  const [, setTick] = useState(0);
  useEffect(() => {
    return mediaCache.subscribe(() => setTick((t) => t + 1));
  }, []);
}
