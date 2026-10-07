"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import TopBar from "@/components/landing/TopBar";
import FunmateCard from "@/components/landing/FunmateCard";
import Skeleton from "@/components/landing/Skeleton";
import EmptyState from "@/components/landing/EmptyState";
import DesktopSidebar from "@/components/DesktopSidebar";
import LandingTourGuide from "@/components/landing/LandingTourGuide";
import UpNextRail from "@/components/landing/UpNextRail";
import { getCachedData, setCachedData } from "@/lib/apiCache";
import {
  getFeedState,
  saveFeedState,
  clearFeedState,
  type FeedState,
} from "@/lib/feedState";
import {
  FUNMATE_SHUFFLE_WINDOW_HOURS,
  orderFunmatesByTier,
} from "@/lib/funmateOrdering";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Funmate {
  _id: string;
  name: string;
  username: string;
  age?: number;
  lga?: string;
  state?: string;
  boostTier: "regular" | "fresher" | "elite" | "elite_plus";
  isVerified?: boolean;
  mediaUrls: string[];
  experiences?: string[];
  vibeBio?: string;
  currentWant?: string;
}

type Tab = "for_you" | "premium" | "regular";

type ResolvedSearchParams = {
  state?: string;
  lga?: string;
  gender?: string;
  orientation?: string;
  minAge?: string;
  maxAge?: string;
};

function hasRenderableMedia(fm: Funmate) {
  return (fm.mediaUrls ?? []).some((url) => Boolean(url && url.trim()));
}

function dedupeFunmates(items: Funmate[]) {
  const map = new Map<string, Funmate>();
  for (const item of items) {
    if (!item?._id) continue;
    map.set(item._id, item);
  }
  return Array.from(map.values());
}

function alignIndexById(
  items: Funmate[],
  selectedId?: string | null,
  fallback = 0,
) {
  if (!selectedId)
    return Math.max(0, Math.min(fallback, Math.max(items.length - 1, 0)));
  const found = items.findIndex((item) => item._id === selectedId);
  return found >= 0
    ? found
    : Math.max(0, Math.min(fallback, Math.max(items.length - 1, 0)));
}

function isHardReload(): boolean {
  if (typeof performance === "undefined") return false;
  const entries = performance.getEntriesByType("navigation");
  const nav = entries[0] as PerformanceNavigationTiming | undefined;
  if (nav) return nav.type === "reload";
  // Fallback for older browsers without Navigation Timing L2
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (performance as any).navigation?.type === 1;
}

let hasCheckedHardReload = false;

export default function LandingPageClient({
  initialFilters = {},
}: {
  initialFilters?: ResolvedSearchParams;
}) {
  const filters = {
    state: initialFilters.state || "",
    lga: initialFilters.lga || "",
    gender: initialFilters.gender || "",
    orientation: initialFilters.orientation || "",
    minAge: initialFilters.minAge || "",
    maxAge: initialFilters.maxAge || "",
  };
  const filterKey = JSON.stringify(filters);

  const [tab, setTab] = useState<Tab>("for_you");
  const [funmates, setFunmates] = useState<Funmate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [idx, setIdx] = useState(0);
  const isFetchingRef = useRef(false);
  const pageRef = useRef(1);
  const feedRef = useRef<HTMLDivElement>(null);
  const lastWheelAt = useRef(0);
  const [restored, setRestored] = useState<FeedState | null | undefined>(
    undefined,
  );
  const lastProcessedComboRef = useRef<string | null>(null);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const didNavigateRef = useRef(false);

  const R2_SIGNED_URL_EXPIRY_MS = 60 * 60 * 1000;
  const STALE_MARGIN_MS = 5 * 60 * 1000;

  const funmatesRef = useRef<Funmate[]>([]);
  useEffect(() => {
    funmatesRef.current = funmates;
  }, [funmates]);

  const getTierShuffleSeed = useCallback(
    (t: Tab, f: typeof filters) =>
      `${t}:${JSON.stringify(f)}:${new Date().toDateString()}`,
    [],
  );

  // Orders ONE batch (a single page's worth of items) internally by tier +
  // stable hash. This must never be run on the whole accumulated feed —
  // doing so relocates already-shown cards and breaks scroll position.
  const orderBatch = useCallback(
    (items: Funmate[], t: Tab, f: typeof filters) =>
      orderFunmatesByTier(
        dedupeFunmates(items),
        getTierShuffleSeed(t, f),
        FUNMATE_SHUFFLE_WINDOW_HOURS,
      ),
    [getTierShuffleSeed],
  );

  // Appends a newly-ordered batch after everything already shown, without
  // touching the order of existing items. Skips any duplicate ids.
  const mergeAppend = useCallback(
    (prev: Funmate[], incomingOrdered: Funmate[]) => {
      const seen = new Set(prev.map((fm) => fm._id));
      const newOnes = incomingOrdered.filter((fm) => !seen.has(fm._id));
      return [...prev, ...newOnes];
    },
    [],
  );

  const refreshRestoredMedia = useCallback(
    async (
      restoredFunmates: Funmate[],
      t: Tab,
      f: typeof filters,
      upToPage: number,
      savedAt: number,
    ) => {
      const byId = new Map<string, string[]>();
      try {
        const pages = Array.from({ length: upToPage }, (_, i) => i + 1);
        await Promise.all(
          pages.map(async (p) => {
            const params = new URLSearchParams({
              tab: t,
              page: String(p),
              limit: "10",
            });
            if (f.state) params.set("state", f.state);
            if (f.lga) params.set("lga", f.lga);
            if (f.gender) params.set("gender", f.gender);
            if (f.orientation) params.set("orientation", f.orientation);
            if (f.minAge) params.set("minAge", f.minAge);
            if (f.maxAge) params.set("maxAge", f.maxAge);

            const res = await fetch(`${API}/api/funmates?${params.toString()}`);
            if (!res.ok) return;
            const data = await res.json();
            (data.funmates || []).forEach((fm: Funmate) => {
              if (fm._id && Array.isArray(fm.mediaUrls))
                byId.set(fm._id, fm.mediaUrls);
            });
          }),
        );
      } catch (err) {
        // console.error("[LandingPage] refreshRestoredMedia ERROR:", err);
        return;
      }

      if (byId.size === 0) return;

      setFunmates((prev) =>
        prev.map((fm) =>
          byId.has(fm._id) ? { ...fm, mediaUrls: byId.get(fm._id)! } : fm,
        ),
      );
    },
    [R2_SIGNED_URL_EXPIRY_MS, STALE_MARGIN_MS],
  );

  const filterVisibleFunmates = useCallback((items: Funmate[]) => {
    return items.filter(hasRenderableMedia);
  }, []);

  // Restore-on-mount: on a genuine hard refresh (F5 / reload button), wipe
  // any saved feed state and start fresh from the top. On any other mount
  // (e.g. returning via back-navigation from a profile page), restore the
  // saved scroll position and order EXACTLY as it was saved — do not re-run
  // tier ordering here, since the saved list is already correctly ordered
  // and re-sorting it would relocate cards and break the restored position.
  useEffect(() => {
    if (!hasCheckedHardReload) {
      hasCheckedHardReload = true;
      if (isHardReload()) {
        clearFeedState();
        queueMicrotask(() => setRestored(null));
        return;
      }
    }

    const found = getFeedState(filterKey);
    if (found) {
      const visible = filterVisibleFunmates(found.funmates);
      queueMicrotask(() => {
        setTab(found.tab as Tab);
        setFunmates(visible);
        setIdx(alignIndexById(visible, found.selectedId, found.idx));
        setHasMore(found.hasMore && visible.length > 0);
        pageRef.current = found.page;
        setLoading(false);
        setRestored(found);
      });
      refreshRestoredMedia(
        visible,
        found.tab as Tab,
        filters,
        found.page,
        found.savedAt,
      );
    } else {
      queueMicrotask(() => setRestored(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFunmates = useCallback(
    async (t: Tab, p: number, f: typeof filters, reset = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        tab: t,
        page: String(p),
        limit: "10",
      });
      if (f.state) params.set("state", f.state);
      if (f.lga) params.set("lga", f.lga);
      if (f.gender) params.set("gender", f.gender);
      if (f.orientation) params.set("orientation", f.orientation);
      if (f.minAge) params.set("minAge", f.minAge);
      if (f.maxAge) params.set("maxAge", f.maxAge);

      const cacheKey = `landing:${params.toString()}`;
      const cached = getCachedData<{ funmates: Funmate[]; hasMore: boolean }>(
        cacheKey,
      );

      if (cached) {
        const visibleCached = filterVisibleFunmates(cached.funmates);
        const orderedBatch = orderBatch(visibleCached, t, f);
        const prevList = funmatesRef.current;
        const merged = reset
          ? orderedBatch
          : mergeAppend(prevList, orderedBatch);
        setFunmates(merged);
        if (!reset) {
          setIdx((currentIdx) =>
            alignIndexById(merged, prevList[currentIdx]?._id, currentIdx),
          );
        }
        setHasMore(cached.hasMore && visibleCached.length > 0);
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
        return;
      }

      const url = `${API}/api/funmates?${params.toString()}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const incoming: Funmate[] = filterVisibleFunmates(data.funmates || []);
        setCachedData(cacheKey, {
          funmates: incoming,
          hasMore: data.hasMore ?? false,
        });
        const orderedBatch = orderBatch(incoming, t, f);
        const prevList = funmatesRef.current;
        const merged = reset
          ? orderedBatch
          : mergeAppend(prevList, orderedBatch);
        setFunmates(merged);
        if (!reset) {
          setIdx((currentIdx) =>
            alignIndexById(merged, prevList[currentIdx]?._id, currentIdx),
          );
        }
        setHasMore((data.hasMore ?? false) && incoming.length > 0);
      } catch (err) {
        // console.error(`[LandingPage] fetch ERROR:`, err);
        if (reset) setFunmates([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [orderBatch, mergeAppend],
  );

  useEffect(() => {
    if (restored === undefined) return;

    const combo = `${tab}::${filterKey}`;
    if (lastProcessedComboRef.current === combo) {
      return;
    }
    const isVeryFirstRun = lastProcessedComboRef.current === null;
    lastProcessedComboRef.current = combo;

    if (isVeryFirstRun && restored) {
      return;
    }

    pageRef.current = 1;
    setIdx(0);
    setHasMore(true);
    fetchFunmates(tab, 1, filters, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filterKey, restored]);

  useEffect(() => {
    if (!hasMore || loading || funmates.length === 0) return;
    if (idx >= funmates.length - 3) {
      const next = pageRef.current + 1;
      pageRef.current = next;
      fetchFunmates(tab, next, filters, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, funmates.length, hasMore, loading, tab]);

  useEffect(() => {
    if (restored === undefined) return;
    saveFeedState({
      tab,
      filterKey,
      selectedId: funmates[idx]?._id ?? null,
      funmates,
      idx,
      hasMore,
      page: pageRef.current,
    });
  }, [tab, filterKey, funmates, idx, hasMore, restored]);

  const handleTabChange = useCallback(
    (nextTab: Tab) => {
      if (nextTab === tab) return;
      setTab(nextTab);
    },
    [tab],
  );

  const goNext = useCallback(() => {
    setIdx((i) => Math.min(i + 1, funmates.length - 1));
  }, [funmates.length]);

  const goPrev = useCallback(() => {
    setIdx((i) => Math.max(i - 1, 0));
  }, []);

  const goToIndex = useCallback(
    (i: number) => {
      setIdx(Math.max(0, Math.min(i, funmates.length - 1)));
    },
    [funmates.length],
  );

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelAt.current < 400) return;
      lastWheelAt.current = now;
      if (e.deltaY > 0) goNext();
      else goPrev();
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [goNext, goPrev]);

  useEffect(() => {
    const el = feedRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
      didNavigateRef.current = false;
    }

    function onTouchEnd(e: TouchEvent) {
      if (!touchStartRef.current || didNavigateRef.current) return;

      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absY < 80) return;
      if (absY < absX * 3) return;
      if (dt > 500) return;

      didNavigateRef.current = true;
      if (dy < 0) goNext();
      else goPrev();
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [goNext, goPrev]);

  return (
    <>
      <DesktopSidebar />
      {!loading && funmates.length > 0 && <LandingTourGuide />}

      {/*
        Mobile: unchanged — a true fixed full-bleed panel above the bottom nav.
        Desktop (lg:+): instead of centering a phone-width card on the whole
        viewport (which ignored the sidebar/rail and looked off-balance), the
        card is centered in the band *between* DesktopSidebar (96px) and
        UpNextRail (360px): center-x = 50vw - (360 - 96) / 2 = 50vw - 132px.
      */}
      <div
        ref={feedRef}
        className='fixed left-0 right-0 top-0 bottom-[calc(55px+env(safe-area-inset-bottom))] overflow-hidden bg-[#05070d] touch-none overscroll-y-none lg:z-20 lg:left-[calc(50vw_-_132px)] lg:right-auto lg:top-1/2 lg:bottom-auto lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[440px] lg:h-[min(860px,calc(100vh_-_4rem))] lg:rounded-[2rem] lg:border lg:border-slate-200 lg:shadow-[0_30px_80px_rgba(15,23,42,0.12)]'>
        <TopBar tab={tab} onTabChange={handleTabChange} />

        {loadingMore && (
          <div className='absolute top-16 right-4 z-40 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full pointer-events-none'>
            <div className='w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin' />
            <span className='text-white text-[10px] font-medium'>
              Loading more
            </span>
          </div>
        )}

        <div className='absolute inset-0'>
          {loading && funmates.length === 0 ? (
            <Skeleton />
          ) : funmates.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            funmates.map((fm, i) => {
              const offset = i - idx;
              if (Math.abs(offset) > 2) return null;
              return (
                <div
                  key={fm._id}
                  className='absolute inset-0 transition-transform duration-350 ease-out will-change-transform'
                  style={{
                    transform: `translateY(${offset * 100}%)`,
                    zIndex: i === idx ? 10 : 5,
                  }}>
                  <FunmateCard
                    funmate={fm}
                    active={offset === 0}
                    onOpenProfile={() => {
                      saveFeedState({
                        tab,
                        filterKey,
                        selectedId: fm._id,
                        funmates,
                        idx: i,
                        hasMore,
                        page: pageRef.current,
                      });
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      <UpNextRail funmates={funmates} idx={idx} onSelect={goToIndex} />
    </>
  );
}
