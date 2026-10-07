"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { capitalize } from "@/lib/capitalize";
import { isGoldTier } from "@/lib/boostTiers";
import TierChip from "@/components/TierBadge";
import { getCoverMedia } from "@/lib/mediaType";
import VerifiedBadge from "@/components/landing/VerifiedBadge";
import type { DiscoverFunmate } from "./types";

const SPEED_PX_PER_SEC = 90;
const CARD_PAUSE_MS = 1800; // dwell time while each card is centered in view
const DRAG_CLICK_THRESHOLD_PX = 6; // movement past this counts as a drag, not a tap
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/** Live-updating prefers-reduced-motion state, SSR-safe, no effect needed. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

function PinIcon() {
  return (
    <svg
      className='h-3 w-3'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      viewBox='0 0 24 24'>
      <path d='M17.7 16.7 13.4 21a2 2 0 0 1-2.8 0l-4.3-4.3a8 8 0 1 1 11.4 0z' />
      <circle cx='12' cy='11' r='3' />
    </svg>
  );
}

function SpotlightTile({
  funmate,
  priority,
  onReady,
}: {
  funmate: DiscoverFunmate;
  priority: boolean;
  onReady?: (id: string) => void;
}) {
  const router = useRouter();
  const cover = getCoverMedia(funmate.mediaUrls);
  const gold = isGoldTier(funmate.boostTier);
  // Older profiles (from before the LGA-based location picker) may only
  // have the legacy city field set, not lga — fall back so they still show
  // a real city name instead of just the state alone.
  const location = [funmate.lga || funmate.city, funmate.state]
    .filter(Boolean)
    .join(", ");
  const experiences = (funmate.experiences ?? []).slice(0, 2);

  // These are paid/boosted placements — a card should never be seen
  // half-rendered. Media stays invisible behind a skeleton until it has
  // actually finished loading, then fades in; see the readiness gate in
  // the parent carousel for the matching rule that holds the rail from
  // ever sliding a not-yet-ready card into the centered "on display" spot.
  const [loaded, setLoaded] = useState(false);
  const markLoaded = () => {
    setLoaded(true);
    onReady?.(funmate._id);
  };

  return (
    <div
      role='button'
      tabIndex={0}
      onMouseEnter={() =>
        router.prefetch(`/funmate/${encodeURIComponent(funmate.username)}`)
      }
      onClick={() =>
        router.push(`/funmate/${encodeURIComponent(funmate.username)}`)
      }
      onKeyDown={(e) => {
        if (e.key === "Enter")
          router.push(`/funmate/${encodeURIComponent(funmate.username)}`);
      }}
      className='relative shrink-0 cursor-pointer overflow-hidden rounded-[28px] bg-slate-900 shadow-[0_20px_34px_-14px_rgba(15,23,42,0.32)] transition-shadow hover:shadow-[0_26px_44px_-14px_rgba(217,119,6,0.4)]'
      style={{ width: "min(78vw, 340px)", aspectRatio: "3 / 4.3" }}>
      {cover && !loaded && (
        <div className='absolute inset-0 animate-pulse bg-gradient-to-br from-slate-800 to-slate-700' />
      )}
      {cover ? (
        cover.isVideo ? (
          <video
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            src={cover.url}
            muted
            playsInline
            preload='metadata'
            draggable={false}
            onLoadedData={markLoaded}
          />
        ) : (
          <img
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            src={cover.url}
            alt={capitalize(funmate.username)}
            loading={priority ? "eager" : "lazy"}
            decoding='async'
            fetchPriority={priority ? "high" : "low"}
            draggable={false}
            onLoad={markLoaded}
            onError={markLoaded}
          />
        )
      ) : (
        <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-4xl font-black text-white/70'>
          {funmate.name?.[0]?.toUpperCase() ?? "?"}
        </div>
      )}

      <div
        className='absolute inset-0'
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.28) 26%, rgba(0,0,0,0) 46%), linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 22%, rgba(0,0,0,0) 40%)",
        }}
      />

      <div className='absolute left-4 right-4 top-3.5 text-white'>
        <div className='flex flex-wrap items-center gap-1.5'>
          <span
            className='text-[17px] font-bold'
            style={{ textShadow: "0 1px 4px rgba(0,0,0,.5)" }}>
            {capitalize(funmate.username)}
          </span>
          {funmate.age && (
            <span className='text-[14.5px] font-medium opacity-90'>
              {funmate.age}
            </span>
          )}
          {funmate.isVerified && (
            <VerifiedBadge golden={gold} className='h-[15px] w-[15px]' />
          )}
          {funmate.boostTier !== "regular" && (
            <TierChip tier={funmate.boostTier} size='sm' variant='overlay' />
          )}
        </div>
        {location && (
          <div className='mt-1.5 flex items-center gap-1 text-[12px] opacity-90'>
            <PinIcon /> {location}
          </div>
        )}
      </div>

      {experiences.length > 0 && (
        <div className='absolute bottom-3.5 left-4 right-4 flex flex-wrap gap-1.5'>
          {experiences.map((exp) => (
            <span
              key={exp}
              className='whitespace-nowrap rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10.5px] font-semibold text-white backdrop-blur-[6px]'>
              {exp}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpotlightCarousel({
  funmates,
}: {
  funmates: DiscoverFunmate[];
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Tracks which funmates' cover media has actually finished loading, keyed
  // by _id. Read imperatively inside the animation loop below (a ref, not
  // state, so updates never trigger their own re-render) — this is what
  // lets the marquee hold a card in place until its image/video is ready,
  // instead of ever sliding a paid placement into view half-loaded.
  const readyIdsRef = useRef<Set<string>>(new Set());

  const markReady = useCallback((id: string) => {
    readyIdsRef.current.add(id);
  }, []);

  // Preload spotlight images with limited concurrency, in the same order
  // they'll appear — not all of them at once. Videos aren't preloaded this
  // way; they report their own readiness via <video onLoadedData> in
  // SpotlightTile, which calls markReady the same way.
  useEffect(() => {
    readyIdsRef.current = new Set();
    let cancelled = false;

    const queue: { id: string; url: string }[] = [];
    for (const fm of funmates) {
      const cover = getCoverMedia(fm.mediaUrls);
      if (!cover) {
        readyIdsRef.current.add(fm._id); // nothing to load, never blocks the rail
      } else if (!cover.isVideo) {
        queue.push({ id: fm._id, url: cover.url });
      }
    }

    const PRELOAD_CONCURRENCY = 3;
    let index = 0;
    function next() {
      if (cancelled || index >= queue.length) return;
      const { id, url } = queue[index++];
      const img = new window.Image();
      img.onload = () => {
        readyIdsRef.current.add(id);
        next();
      };
      img.onerror = () => {
        // Don't let one broken URL stall the whole rail forever.
        readyIdsRef.current.add(id);
        next();
      };
      img.src = url;
    }
    for (let i = 0; i < PRELOAD_CONCURRENCY; i++) next();

    return () => {
      cancelled = true;
    };
  }, [funmates]);

  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    const progressBar = progressRef.current;
    if (!track || !viewport || !progressBar || funmates.length === 0) return;
    if (prefersReducedMotion) return; // CSS fallback lets them scroll it manually

    let halfWidth = 0;
    let cardStep = 0;
    let offset = 0;
    let nextStepOffset = 0;
    let pausedUntil = 0;
    let interactionPaused = false; // desktop hover
    let dragging = false; // active pointer drag (mouse, touch, or pen)
    let dragPointerId: number | null = null;
    let dragStartX = 0;
    let dragStartOffset = 0;
    let dragDistance = 0;
    let suppressNextClick = false;
    let lastFrameTime: number | null = null;
    let rafId = 0;

    // Dynamic centering padding still matters here even without per-card
    // stopping: it's what makes card 1 sit genuinely centered at the very
    // start instead of flush against the left edge, so the first frame
    // already looks intentional rather than mid-scroll.
    function computeGeometry() {
      if (!track || !viewport) return;
      const cards = [...track.children] as HTMLElement[];
      if (cards.length === 0) return;

      const viewportWidth = viewport.clientWidth;
      const cardWidth = cards[0].offsetWidth;
      const centerPadding = Math.max(0, (viewportWidth - cardWidth) / 2);
      track.style.paddingLeft = `${centerPadding}px`;
      track.style.paddingRight = `${centerPadding}px`;

      // Distance from one card's start to the next card's start (width +
      // gap). Every card is the same fixed width, so this step is uniform
      // across the whole track and is the unit we advance by, one card at
      // a time, between pauses.
      cardStep =
        cards.length > 1
          ? cards[1].offsetLeft - cards[0].offsetLeft
          : cards[0].offsetWidth;

      // halfWidth = distance from the first card of set 1 to the first card
      // of set 2 (the exact duplicate) — this is the true repeat distance
      // of the pattern. Wrapping offset by exactly this amount, every
      // frame, is what makes the loop genuinely gapless: set 2 at
      // offset=halfWidth renders pixel-identical to set 1 at offset=0, so
      // there is no discrete position to "snap" across and therefore
      // nothing that can visibly jump — the last card sliding out and the
      // first sliding back in is just what continuous motion through a
      // repeating pattern looks like.
      const secondSetStart = cards[funmates.length];
      halfWidth = secondSetStart
        ? secondSetStart.offsetLeft - cards[0].offsetLeft
        : track.scrollWidth;

      // Re-anchor the next stopping point to a real card boundary whenever
      // geometry changes (e.g. on resize), so a resize mid-scroll doesn't
      // leave the carousel drifting past cards without ever pausing on one.
      if (cardStep > 0) {
        const stepsTaken = Math.round(offset / cardStep);
        nextStepOffset = stepsTaken * cardStep + cardStep;
      }
    }

    // Indicator tracks the same continuous offset, one loop-cycle at a time.
    function updateIndicator() {
      if (!progressBar || halfWidth <= 0) return;
      const progress = Math.min(1, Math.max(0, offset / halfWidth));
      progressBar.style.transform = `scaleX(${progress})`;
    }

    function wrapOffset(value: number) {
      if (halfWidth <= 0) return value;
      let v = value % halfWidth;
      if (v < 0) v += halfWidth;
      return v;
    }

    // Shared by both the automatic tick and manual dragging, so the track
    // position and progress indicator always stay in sync regardless of
    // who's currently driving the offset.
    function applyOffset(value: number) {
      offset = wrapOffset(value);
      if (track) track.style.transform = `translateX(${-offset}px)`;
      updateIndicator();
    }

    function tick(now: number) {
      if (lastFrameTime === null) lastFrameTime = now;
      const dt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      const isPaused = interactionPaused || dragging || now < pausedUntil;

      // Never let the rail advance toward a card whose media hasn't
      // finished loading — these are paid placements, so nothing should
      // ever be seen sliding into the centered spot half-loaded. This just
      // holds the current position a little longer; it doesn't affect
      // dragging, which the user is already deliberately controlling.
      let upcomingReady = true;
      if (cardStep > 0 && funmates.length > 0) {
        const idx =
          ((Math.round(nextStepOffset / cardStep) % funmates.length) +
            funmates.length) %
          funmates.length;
        const upcoming = funmates[idx];
        upcomingReady = !upcoming || readyIdsRef.current.has(upcoming._id);
      }

      if (
        !isPaused &&
        upcomingReady &&
        halfWidth > 0 &&
        cardStep > 0 &&
        track
      ) {
        offset += SPEED_PX_PER_SEC * dt;
        // Stop exactly when the next card reaches the centered position,
        // and hold there for CARD_PAUSE_MS before advancing again — this
        // is what gives each card its own moment in view instead of the
        // rail gliding past everything continuously.
        if (offset >= nextStepOffset) {
          offset = nextStepOffset;
          pausedUntil = now + CARD_PAUSE_MS;
          nextStepOffset += cardStep;
        }
        // Wrap both offset and the next stopping point together so the
        // loop stays gapless (see computeGeometry) while still landing on
        // a real card boundary right after the wrap.
        if (offset >= halfWidth) {
          offset -= halfWidth;
          nextStepOffset -= halfWidth;
        }
      }

      if (track) track.style.transform = `translateX(${-offset}px)`;
      updateIndicator();
      rafId = requestAnimationFrame(tick);
    }

    offset = 0;
    computeGeometry(); // also sets nextStepOffset = cardStep from offset 0
    // Card 1 gets its dwell as the opening impression before the first
    // move, then every card after it gets the same CARD_PAUSE_MS pause
    // once it reaches the centered position.
    pausedUntil = performance.now() + CARD_PAUSE_MS;
    rafId = requestAnimationFrame(tick);

    const onResize = () => computeGeometry();
    window.addEventListener("resize", onResize);

    // Mouse-only hover pause. Deliberately mouseenter/mouseleave rather than
    // pointerenter/pointerleave: on touch devices pointerleave can fail to
    // fire reliably after a touch ends, which would leave the carousel
    // stuck paused forever. Touch pausing is handled by the drag state
    // below instead, which has an explicit, reliable end (pointerup /
    // pointercancel).
    const pause = () => {
      interactionPaused = true;
    };
    const resume = () => {
      interactionPaused = false;
    };
    viewport.addEventListener("mouseenter", pause);
    viewport.addEventListener("mouseleave", resume);

    // Manual scroll: drag (mouse, touch, or pen) to move between cards
    // without waiting for the timer, while preserving the same auto-play
    // flow the rest of the time.
    function onPointerDown(e: PointerEvent) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      dragPointerId = e.pointerId;
      dragStartX = e.clientX;
      dragStartOffset = offset;
      dragDistance = 0;
      viewport?.setPointerCapture(e.pointerId);
      if (viewport) viewport.style.cursor = "grabbing";
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging || e.pointerId !== dragPointerId) return;
      const delta = dragStartX - e.clientX; // dragging left moves the rail forward
      dragDistance = Math.max(dragDistance, Math.abs(delta));
      applyOffset(dragStartOffset + delta);
    }

    function endDrag(e: PointerEvent) {
      if (!dragging || e.pointerId !== dragPointerId) return;
      dragging = false;
      dragPointerId = null;
      if (viewport) viewport.style.cursor = "";
      try {
        viewport?.releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture may already be released by the browser; ignore
      }

      if (dragDistance > DRAG_CLICK_THRESHOLD_PX) {
        // Real drag, not a tap — swallow the click so it doesn't also
        // navigate into whichever card the pointer happens to be over.
        suppressNextClick = true;
      }

      if (cardStep > 0) {
        // Snap to whichever card ended up closest to centered, so a drag
        // never leaves the rail resting between two cards.
        const nearestSteps = Math.round(offset / cardStep);
        const snapped = wrapOffset(nearestSteps * cardStep);
        applyOffset(snapped);
        nextStepOffset = snapped + cardStep;
      }

      // Give the card the user just dragged to its own dwell, same as a
      // card the auto-play reaches on its own, instead of immediately
      // yanking control back into automatic scrolling.
      pausedUntil = performance.now() + CARD_PAUSE_MS;
    }

    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    // A drag that moved past the threshold shouldn't also fire the card's
    // navigation click. Capture-phase so this runs before the click ever
    // reaches the card.
    function onClickCapture(e: MouseEvent) {
      if (suppressNextClick) {
        e.stopPropagation();
        e.preventDefault();
        suppressNextClick = false;
      }
    }
    viewport.addEventListener("click", onClickCapture, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      viewport.removeEventListener("mouseenter", pause);
      viewport.removeEventListener("mouseleave", resume);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", endDrag);
      viewport.removeEventListener("pointercancel", endDrag);
      viewport.removeEventListener("click", onClickCapture, true);
    };
  }, [funmates, prefersReducedMotion]);

  if (funmates.length === 0) return null;

  const doubled = [...funmates, ...funmates];

  return (
    <section className='relative overflow-hidden pt-2'>
      <div
        className='absolute inset-x-[-10%] -top-10 h-64 pointer-events-none'
        style={{
          background:
            "radial-gradient(60% 60% at 20% 20%, rgba(245,158,11,0.16), transparent 70%), radial-gradient(50% 50% at 85% 10%, rgba(37,99,235,0.13), transparent 70%)",
          filter: "blur(10px)",
        }}
      />
      <div
        ref={viewportRef}
        className={`relative py-1.5 pb-6 ${prefersReducedMotion ? "overflow-x-auto" : "overflow-hidden"}`}
        style={
          prefersReducedMotion
            ? undefined
            : {
                WebkitMaskImage:
                  "linear-gradient(90deg, transparent, black 4%, black 96%, transparent)",
                maskImage:
                  "linear-gradient(90deg, transparent, black 4%, black 96%, transparent)",
                touchAction: "pan-y", // let vertical page scroll through, capture horizontal for the drag
                cursor: "grab",
                userSelect: "none",
                WebkitUserSelect: "none",
              }
        }>
        <div
          ref={trackRef}
          className={`flex gap-3.5 ${prefersReducedMotion ? "px-2.5" : ""}`}
          style={
            prefersReducedMotion
              ? { width: "max-content" }
              : { width: "max-content", willChange: "transform" }
          }>
          {(prefersReducedMotion ? funmates : doubled).map((fm, i) => (
            <SpotlightTile
              key={`${fm._id}-${i}`}
              funmate={fm}
              priority={i < 3}
              onReady={markReady}
            />
          ))}
        </div>
      </div>

      {!prefersReducedMotion && (
        <div
          className='mx-auto -mt-1 mb-1 h-[3px] overflow-hidden rounded-full bg-slate-900/[0.08]'
          style={{ width: "min(78vw, 340px)" }}>
          <div
            ref={progressRef}
            className='h-full w-full origin-left rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706]'
            style={{ transform: "scaleX(0)", willChange: "transform" }}
          />
        </div>
      )}
    </section>
  );
}
