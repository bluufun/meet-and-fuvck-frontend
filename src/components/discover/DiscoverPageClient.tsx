"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import DesktopSidebar from "@/components/DesktopSidebar";
import { getCachedData, setCachedData } from "@/lib/apiCache";
import {
  orderFunmatesByTier,
  FUNMATE_SHUFFLE_WINDOW_HOURS,
} from "@/lib/funmateOrdering";
import { NIGERIA_STATES } from "@/lib/nigeria-locations";
import {
  readDiscoverState,
  saveDiscoverScroll,
  saveDiscoverState,
  clearDiscoverState,
  type DiscoverSnapshot,
} from "@/lib/discoverState";
import SpotlightCarousel from "./SpotlightCarousel";
import DiscoverHeaderActions from "./DiscoverHeaderActions";
import DiscoverSearchBar from "./DiscoverSearchBar";
import { TierBadge } from "@/components/TierBadge";
import DiscoverGridCard from "./DiscoverGridCard";
import DiscoverFilterDrawer, {
  DISCOVER_FILTER_INITIAL,
  type DiscoverFilterState,
} from "./DiscoverFilterDrawer";
import type { DiscoverFunmate } from "./types";
import { LoaderBlack } from "../Loader";
import BrandLogo from "../BrandLogo";
import MobileMenuPanel from "../landing/MobileMenuPanel";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const NEAR_ME_CACHE_KEY = "discover:nearMeState";

type DiscoverTab = "all" | "newest" | "elite_plus" | "elite" | "near_me";

const TABS: { id: DiscoverTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "newest", label: "Newest" },
  { id: "elite_plus", label: "Elite Plus" },
  { id: "elite", label: "Elite" },
  { id: "near_me", label: "Near me" },
];

type NearMeStatus =
  | "idle"
  | "locating"
  | "resolved"
  | "denied"
  | "unsupported"
  | "error"
  | "manual";

function hasRenderableMedia(fm: DiscoverFunmate) {
  return (fm.mediaUrls ?? []).some((url) => Boolean(url && url.trim()));
}

function dedupeFunmates(items: DiscoverFunmate[]) {
  const map = new Map<string, DiscoverFunmate>();
  for (const item of items) {
    if (!item?._id) continue;
    map.set(item._id, item);
  }
  return Array.from(map.values());
}

function buildParams(opts: {
  tabId: DiscoverTab;
  filters: DiscoverFilterState;
  nearMeState: string | null;
  page: number;
}) {
  const { tabId, filters, nearMeState, page } = opts;
  const params = new URLSearchParams({ page: String(page), limit: "12" });

  if (tabId === "newest") {
    params.set("tab", "for_you");
    params.set("sort", "newest");
  } else if (tabId === "elite_plus" || tabId === "elite") {
    params.set("boostTier", tabId);
  } else {
    params.set("tab", "for_you");
  }

  const effectiveState =
    tabId === "near_me" ? nearMeState || "" : filters.state;
  if (effectiveState) params.set("state", effectiveState);
  if (tabId !== "near_me" && filters.lga) params.set("lga", filters.lga);
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.orientation) params.set("orientation", filters.orientation);
  if (filters.minAge) params.set("minAge", filters.minAge);
  if (filters.maxAge) params.set("maxAge", filters.maxAge);

  return params;
}

// Search runs over the cards already loaded (and keeps pulling further pages
// while a search has too few matches), so typing feels instant. Every word the
// person types must match somewhere in the card's searchable text.
const SEARCH_MIN_RESULTS = 12;
const SEARCH_MAX_AUTO_PAGES = 10;

function matchesQuery(fm: DiscoverFunmate, tokens: string[]) {
  if (tokens.length === 0) return true;
  const haystack = [
    fm.username,
    fm.name,
    fm.lga,
    fm.city,
    fm.state,
    fm.vibeBio,
    ...(fm.experiences ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}

function GridSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4'>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className='animate-pulse overflow-hidden rounded-[20px] bg-slate-200'>
          <div className='aspect-[4/5] w-full bg-slate-300/70' />
          <div className='space-y-2 px-3.5 pb-4 pt-3'>
            <div className='h-3.5 w-2/3 rounded bg-slate-300/80' />
            <div className='h-3 w-1/2 rounded bg-slate-300/60' />
            <div className='h-3 w-full rounded bg-slate-300/50' />
          </div>
        </div>
      ))}
    </div>
  );
}

function GridEmptyState({ tabId }: { tabId: DiscoverTab }) {
  return (
    <div className='flex flex-col items-center gap-3 rounded-3xl border border-slate-100 bg-slate-50 px-6 py-14 text-center'>
      <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900/5'>
        <svg
          className='h-7 w-7 text-slate-400'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={1.6}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      </div>
      <p className='font-semibold text-slate-800'>
        {tabId === "elite_plus" || tabId === "elite"
          ? "No one on this tier yet"
          : tabId === "near_me"
            ? "No funmates found nearby"
            : "No funmates here yet"}
      </p>
      <p className='max-w-xs text-sm text-slate-500'>
        {tabId === "near_me"
          ? "Try a different state from the filter, or check back soon as more funmates join."
          : "Check back soon, new funmates join every day."}
      </p>
    </div>
  );
}

function SearchEmptyState({
  query,
  searching,
  onClear,
}: {
  query: string;
  searching: boolean;
  onClear: () => void;
}) {
  if (searching) {
    return (
      <div className='flex flex-col items-center gap-2 rounded-3xl border border-slate-100 bg-slate-50 px-6 py-12 text-center'>
        <div className='h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700' />
        <p className='text-sm font-medium text-slate-600'>
          Searching for “{query}”…
        </p>
      </div>
    );
  }
  return (
    <div className='flex flex-col items-center gap-3 rounded-3xl border border-slate-100 bg-slate-50 px-6 py-12 text-center'>
      <p className='font-semibold text-slate-800'>No one matches “{query}”</p>
      <p className='max-w-xs text-sm text-slate-500'>
        Try a different name or city, or check your spelling.
      </p>
      <button
        type='button'
        onClick={onClear}
        className='rounded-full bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white transition active:scale-95'>
        Clear search
      </button>
    </div>
  );
}

function NearMePanel({
  status,
  onRetry,
  onManualState,
}: {
  status: NearMeStatus;
  onRetry: () => void;
  onManualState: (state: string) => void;
}) {
  if (status === "locating") {
    return (
      <div className='flex flex-col items-center gap-2 rounded-3xl border border-slate-100 bg-slate-50 px-6 py-10 text-center'>
        <div className='h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700' />
        <p className='text-sm font-medium text-slate-600'>
          Finding funmates near you…
        </p>
      </div>
    );
  }

  const message =
    status === "unsupported"
      ? "Your browser doesn't support location detection."
      : status === "denied"
        ? "Location access was denied."
        : status === "manual"
          ? "Choose the state you'd like to browse."
          : "We couldn't pin down your location.";

  return (
    <div className='flex flex-col items-center gap-3 rounded-3xl border border-slate-100 bg-slate-50 px-6 py-8 text-center'>
      <p className='text-sm font-medium text-slate-600'>{message}</p>
      <p className='text-xs text-slate-400'>Pick your state instead:</p>
      <select
        onChange={(e) => e.target.value && onManualState(e.target.value)}
        defaultValue=''
        className='w-full max-w-[240px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400'>
        <option value='' disabled>
          Choose a state
        </option>
        {NIGERIA_STATES.map((s) => (
          <option key={s.state} value={s.state}>
            {s.state}
          </option>
        ))}
      </select>
      {status !== "unsupported" && (
        <button
          type='button'
          onClick={onRetry}
          className='text-xs font-semibold text-[#1E3A8A] underline underline-offset-2'>
          Try location detection again
        </button>
      )}
    </div>
  );
}

export default function DiscoverPageClient() {
  const [tabId, setTabId] = useState<DiscoverTab>("all");
  const [filters, setFilters] = useState<DiscoverFilterState>(
    DISCOVER_FILTER_INITIAL,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [funmates, setFunmates] = useState<DiscoverFunmate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const [spotlight, setSpotlight] = useState<DiscoverFunmate[]>([]);
  const [spotlightSettled, setSpotlightSettled] = useState(false);
  const [firstGridSettled, setFirstGridSettled] = useState(false);
  const firstGridDoneRef = useRef(false);
  // True only for the very first paint — flips to false once the spotlight
  // rail and the first page of the grid have both settled (success or
  // failure), so the whole page reveals together in one clean shot instead
  // of the carousel and grid popping in separately at different times.
  const initialLoading = !spotlightSettled || !firstGridSettled;

  const [nearMeState, setNearMeState] = useState<string | null>(null);
  const [nearMeStatus, setNearMeStatus] = useState<NearMeStatus>("idle");

  const filterKey = JSON.stringify(filters);

  // ── Back-navigation restore ──
  // undefined = still checking for a saved snapshot, null = nothing to
  // restore (fresh visit), otherwise the snapshot that was applied on mount.
  const [restored, setRestored] = useState<DiscoverSnapshot | null | undefined>(
    undefined,
  );
  const skipRestoredFetchRef = useRef(false);
  const pendingScrollRef = useRef<number | null>(null);
  const gridLoadedAtRef = useRef(0);

  const searchTokens = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  );
  const searchActive = searchTokens.length > 0;

  const getShuffleSeed = useCallback(
    (t: DiscoverTab, f: DiscoverFilterState) =>
      `discover:${t}:${JSON.stringify(f)}:${new Date().toDateString()}`,
    [],
  );

  const orderBatch = useCallback(
    (items: DiscoverFunmate[], t: DiscoverTab, f: DiscoverFilterState) => {
      const deduped = dedupeFunmates(items);
      if (t === "newest") return deduped; // literal newest-first, no reshuffle
      return orderFunmatesByTier(
        deduped,
        getShuffleSeed(t, f),
        FUNMATE_SHUFFLE_WINDOW_HOURS,
      );
    },
    [getShuffleSeed],
  );

  // ── Spotlight: fetched once on mount, independent of tabs/filters ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cacheKey = "discover:spotlight";
        const cached = getCachedData<{ funmates: DiscoverFunmate[] }>(cacheKey);
        if (cached) {
          if (!cancelled)
            setSpotlight(cached.funmates.filter(hasRenderableMedia));
          return;
        }
        const res = await fetch(
          `${API}/api/funmates?tab=premium&page=1&limit=10`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const incoming: DiscoverFunmate[] = (data.funmates || []).filter(
          hasRenderableMedia,
        );
        setCachedData(cacheKey, { funmates: incoming });
        if (!cancelled) {
          setSpotlight(
            orderFunmatesByTier(
              dedupeFunmates(incoming),
              "discover:spotlight",
              FUNMATE_SHUFFLE_WINDOW_HOURS,
            ),
          );
        }
      } catch (err) {
        // Non-critical — the page still works fine with no spotlight rail.
        console.error("[Discover] spotlight fetch error:", err);
      } finally {
        if (!cancelled) setSpotlightSettled(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Grid fetch ──
  const fetchGrid = useCallback(
    async (
      t: DiscoverTab,
      f: DiscoverFilterState,
      nms: string | null,
      page: number,
      reset: boolean,
    ) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const params = buildParams({
        tabId: t,
        filters: f,
        nearMeState: nms,
        page,
      });
      const cacheKey = `discover:${params.toString()}`;
      const cached = getCachedData<{
        funmates: DiscoverFunmate[];
        hasMore: boolean;
      }>(cacheKey);

      const markFirstGridSettled = () => {
        if (!firstGridDoneRef.current) {
          firstGridDoneRef.current = true;
          setFirstGridSettled(true);
        }
      };

      const apply = (incoming: DiscoverFunmate[], moreAvailable: boolean) => {
        const visible = incoming.filter(hasRenderableMedia);
        const orderedBatch = orderBatch(visible, t, f);
        if (reset) gridLoadedAtRef.current = Date.now();
        setFunmates((prev) => {
          if (reset) return orderedBatch;
          const seen = new Set(prev.map((fm) => fm._id));
          return [...prev, ...orderedBatch.filter((fm) => !seen.has(fm._id))];
        });
        setHasMore(moreAvailable && visible.length > 0);
      };

      if (cached) {
        apply(cached.funmates, cached.hasMore);
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
        markFirstGridSettled();
        return;
      }

      try {
        const res = await fetch(`${API}/api/funmates?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const incoming: DiscoverFunmate[] = data.funmates || [];
        setCachedData(cacheKey, {
          funmates: incoming.filter(hasRenderableMedia),
          hasMore: data.hasMore ?? false,
        });
        apply(incoming, data.hasMore ?? false);
      } catch (err) {
        console.error("[Discover] grid fetch error:", err);
        if (reset) setFunmates([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
        markFirstGridSettled();
      }
    },
    [orderBatch],
  );

  // Restore-on-mount: when returning from a funmate profile (back button or
  // in-app navigation) re-apply the saved tab, filters, loaded cards and
  // scroll offset instead of starting over. A hard refresh clears the saved
  // state first (see readDiscoverState), so it still starts fresh from the top.
  useEffect(() => {
    const found = readDiscoverState();
    if (!found) {
      queueMicrotask(() => setRestored(null));
      return;
    }
    const { snapshot, scrollY } = found;
    skipRestoredFetchRef.current = true;
    firstGridDoneRef.current = true;
    pageRef.current = snapshot.page;
    gridLoadedAtRef.current = snapshot.loadedAt;
    pendingScrollRef.current = scrollY;
    queueMicrotask(() => {
      setTabId(snapshot.tabId);
      setFilters(snapshot.filters);
      setQuery(snapshot.query ?? "");
      setFunmates(snapshot.funmates);
      setHasMore(snapshot.hasMore);
      if (snapshot.nearMeState) {
        setNearMeState(snapshot.nearMeState);
        setNearMeStatus("resolved");
      }
      setLoading(false);
      setFirstGridSettled(true);
      setRestored(snapshot);
    });
  }, []);

  // Reset + refetch whenever the active tab or filters change.
  useEffect(() => {
    if (restored === undefined) return; // still checking for a saved snapshot
    if (skipRestoredFetchRef.current) {
      // The grid was just restored from the snapshot — it's already on screen.
      skipRestoredFetchRef.current = false;
      return;
    }
    if (tabId === "near_me" && !nearMeState) return; // wait for location resolution
    pageRef.current = 1;
    const fetchId = window.setTimeout(() => {
      void fetchGrid(tabId, filters, nearMeState, 1, true);
    }, 0);
    return () => window.clearTimeout(fetchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId, filterKey, nearMeState, restored]);

  // Keep the snapshot in sync with what's on screen so it's ready whenever
  // the user leaves (card click, bottom nav, browser back, …).
  useEffect(() => {
    if (restored === undefined || initialLoading || loading) return;
    if (funmates.length === 0) {
      clearDiscoverState();
      return;
    }
    if (tabId === "near_me" && !nearMeState) return;
    saveDiscoverState({
      tabId,
      filters,
      funmates,
      hasMore,
      page: pageRef.current,
      nearMeState,
      query,
      loadedAt: gridLoadedAtRef.current,
    });
  }, [
    restored,
    initialLoading,
    loading,
    tabId,
    filters,
    funmates,
    hasMore,
    nearMeState,
    query,
  ]);

  // Put the page back at the saved offset once the restored grid is actually
  // in the DOM (layout effect = before paint, so there's no visible jump from
  // the top). Card media boxes have fixed aspect ratios, so the height is
  // already final at this point.
  useLayoutEffect(() => {
    if (initialLoading || loading || pendingScrollRef.current === null) return;
    const y = pendingScrollRef.current;
    pendingScrollRef.current = null;
    window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });
  }, [initialLoading, loading]);

  // Track the scroll offset. Only starts after the initial reveal so the
  // loader's scrollY of 0 can never overwrite a saved offset before restore.
  useEffect(() => {
    if (restored === undefined || initialLoading) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        saveDiscoverScroll(window.scrollY);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [restored, initialLoading]);

  function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    const next = pageRef.current + 1;
    pageRef.current = next;
    fetchGrid(tabId, filters, nearMeState, next, false);
  }

  const displayed = useMemo(
    () =>
      searchActive
        ? funmates.filter((fm) => matchesQuery(fm, searchTokens))
        : funmates,
    [funmates, searchActive, searchTokens],
  );

  // While searching, keep pulling further pages until there are enough
  // matches (or the feed runs out), so a rare name isn't missed just because
  // it sits on a page that hasn't been scrolled to yet.
  useEffect(() => {
    if (!searchActive || initialLoading || loading || loadingMore) return;
    if (!hasMore || displayed.length >= SEARCH_MIN_RESULTS) return;
    if (pageRef.current >= SEARCH_MAX_AUTO_PAGES) return;
    if (tabId === "near_me" && !nearMeState) return;
    handleLoadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchActive,
    initialLoading,
    loading,
    loadingMore,
    hasMore,
    displayed.length,
    tabId,
    nearMeState,
  ]);

  // Auto-load the next page as the sentinel (rendered just past the last
  // card) scrolls into view — replaces the old manual "Load more" button.
  // rootMargin fires the fetch a bit before the sentinel is actually
  // on-screen so the next batch is ready by the time someone reaches it.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading || initialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) handleLoadMore();
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, initialLoading, tabId, filterKey, nearMeState]);

  // ── Near-me geolocation flow ──
  function resolveNearMe() {
    const cachedState =
      typeof window !== "undefined"
        ? sessionStorage.getItem(NEAR_ME_CACHE_KEY)
        : null;
    if (cachedState) {
      setNearMeState(cachedState);
      setNearMeStatus("resolved");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setNearMeStatus("unsupported");
      return;
    }

    setNearMeStatus("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          // Low-accuracy fixes (IP/Wi-Fi-based, common on desktop browsers
          // without GPS) can be off by tens of kilometers — enough to land
          // in a neighboring state. Logged so real-world accuracy is
          // visible; still used since it's better than nothing, but this is
          // a hard ceiling on precision that only real GPS (mobile devices,
          // which is what production traffic will mostly be) fixes.
          if (accuracy > 50000) {
            console.warn(
              `[Discover] low-confidence geolocation fix: accuracy=${Math.round(accuracy)}m`,
            );
          }
          const res = await fetch(
            `${API}/api/geo/reverse-geocode?lat=${latitude}&lng=${longitude}`,
          );
          const data = await res.json().catch(() => ({}));
          if (data?.state) {
            sessionStorage.setItem(NEAR_ME_CACHE_KEY, data.state);
            setNearMeState(data.state);
            setNearMeStatus("resolved");
          } else {
            setNearMeStatus("error");
          }
        } catch (err) {
          console.error("[Discover] reverse-geocode error:", err);
          setNearMeStatus("error");
        }
      },
      (geoError) => {
        setNearMeStatus(
          geoError.code === geoError.PERMISSION_DENIED ? "denied" : "error",
        );
      },
      // enableHighAccuracy asks the device to use GPS instead of falling
      // back straight to network/IP-based location where possible — makes
      // a real difference on mobile (production's primary audience), though
      // it can't overcome the lack of a GPS sensor on a desktop browser.
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    );
  }

  function handleTabChange(next: DiscoverTab) {
    setTabId(next);
    if (next === "near_me" && nearMeStatus === "idle") {
      resolveNearMe();
    }
  }

  function handleManualNearMeState(state: string) {
    if (typeof window !== "undefined")
      sessionStorage.setItem(NEAR_ME_CACHE_KEY, state);
    setNearMeState(state);
    setNearMeStatus("resolved");
  }

  const showNearMePanel = tabId === "near_me" && nearMeStatus !== "resolved";

  return (
    <>
      <div className='min-h-screen bg-[#F6F7FB] pb-28 lg:pl-24'>
        <DesktopSidebar showLogo={false} />

        {/* Top nav */}
        <header className='sticky top-0 z-40 border-b border-slate-900/[0.06] bg-[#F6F7FB]/85 backdrop-blur-md'>
          <div className='mx-auto flex w-full max-w-6xl items-center justify-between px-3 py-3.5 lg:px-6 xl:px-8'>
            <div className='flex items-center gap-2 md:block'>
              <button
                type='button'
                onClick={() => setMenuOpen(true)}
                className='  text-black transition hover:scale-90 active:scale-95 lg:hidden cursor-alias'
                aria-label='Open menu'>
                <Menu className='h-6 w-6 stroke-2' />
              </button>

              <Link href='/' className='inline-block'>
                <BrandLogo width={128} height={30} priority />
              </Link>
            </div>
            <DiscoverHeaderActions />
          </div>
        </header>

        {initialLoading ? (
          <div className='flex min-h-[60vh] flex-col items-center justify-center gap-3'>
            <LoaderBlack />
            <p className='text-xs font-medium text-slate-400 mt-6'>
              Finding funmates for you…
            </p>
          </div>
        ) : (
          <>
            {/* Spotlight carousel */}
            <SpotlightCarousel funmates={spotlight} />

            {/* Grid section */}
            <section className='mx-auto w-full max-w-6xl px-3 pt-10 lg:px-6 xl:px-8'>
              <DiscoverSearchBar
                query={query}
                onQueryChange={setQuery}
                filters={filters}
                onFiltersChange={setFilters}
                onOpenFilters={() => setFilterOpen(true)}
              />

              <div
                className='mb-3 flex items-center gap-2 overflow-x-auto pb-1'
                style={{ scrollbarWidth: "none" }}>
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type='button'
                    onClick={() => handleTabChange(t.id)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
                      tabId === t.id
                        ? "bg-[#0F172A] text-white"
                        : "border border-slate-900/[0.08] bg-white text-[#0F172A] hover:bg-slate-50"
                    }`}>
                    {(t.id === "elite_plus" || t.id === "elite") && (
                      <TierBadge
                        tier={t.id}
                        size={13}
                        className='mr-1.5 inline-block -translate-y-px align-middle'
                      />
                    )}
                    {t.label}
                  </button>
                ))}
              </div>

              {tabId === "near_me" &&
                nearMeStatus === "resolved" &&
                nearMeState && (
                  <div className='mb-3 flex items-center justify-between rounded-2xl bg-slate-900/[0.04] px-4 py-2.5 text-xs'>
                    <span className='text-slate-500'>
                      Showing funmates in{" "}
                      <span className='font-semibold text-slate-800'>
                        {nearMeState}
                      </span>
                    </span>
                    <button
                      type='button'
                      onClick={() => {
                        if (typeof window !== "undefined")
                          sessionStorage.removeItem(NEAR_ME_CACHE_KEY);
                        setNearMeState(null);
                        setNearMeStatus("manual"); // shows the manual state picker directly
                      }}
                      className='shrink-0 font-semibold text-[#1E3A8A] underline underline-offset-2'>
                      Not right? Change
                    </button>
                  </div>
                )}

              {showNearMePanel ? (
                <NearMePanel
                  status={nearMeStatus}
                  onRetry={resolveNearMe}
                  onManualState={handleManualNearMeState}
                />
              ) : loading ? (
                <GridSkeleton />
              ) : funmates.length === 0 ? (
                <GridEmptyState tabId={tabId} />
              ) : displayed.length === 0 ? (
                <SearchEmptyState
                  query={query.trim()}
                  searching={hasMore}
                  onClear={() => setQuery("")}
                />
              ) : (
                <>
                  {searchActive && (
                    <p
                      className='mb-3 px-1 text-xs font-medium text-slate-500'
                      aria-live='polite'>
                      {displayed.length}
                      {hasMore ? "+" : ""} match
                      {displayed.length === 1 && !hasMore ? "" : "es"} for “
                      {query.trim()}”
                    </p>
                  )}
                  <div className='grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4'>
                    {displayed.map((fm) => (
                      <DiscoverGridCard key={fm._id} funmate={fm} />
                    ))}
                  </div>

                  {hasMore && (
                    <div
                      ref={sentinelRef}
                      className='mt-6 flex justify-center py-4'>
                      {loadingMore && (
                        <div className='h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700' />
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}

        <DiscoverFilterDrawer
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          initialFilters={filters}
          onApply={setFilters}
        />
      </div>

      <MobileMenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
