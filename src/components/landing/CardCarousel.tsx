"use client";

import { useEffect, useRef, useState } from "react";
import { mediaCache } from "@/lib/mediaCache";
import { useMediaCacheVersion } from "@/lib/useMediaCacheVersion";

interface CardCarouselProps {
  urls: string[];
  name: string;
  onIndexChange?: (index: number) => void;
  active?: boolean; // true only for the card currently in view in the feed
}

function isVideoUrl(url: string) {
  const clean = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v)$/i.test(clean);
}

export default function CardCarousel({
  urls,
  name,
  onIndexChange,
  active = true,
}: CardCarouselProps) {
  useMediaCacheVersion(); // re-render once preloaded media becomes available

  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iconTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const hasMultiple = urls.length > 1;
  const current = urls[index];
  const broken = failed.has(index);
  const currentIsVideo = current ? isVideoUrl(current) : false;

  // Always warm the currently visible slide
  useEffect(() => {
    if (!current) return;
    isVideoUrl(current)
      ? mediaCache.preloadVideo(current)
      : mediaCache.preloadImage(current);
  }, [current]);

  // When this card becomes the active one in the feed, prefetch the REST
  // of its media too — so swiping left/right is instant with no spinner.
  useEffect(() => {
    if (!active || urls.length <= 1) return;
    mediaCache.preloadAll(urls, isVideoUrl);
  }, [active, urls]);

  // Free video blobs once this card is gone from the DOM entirely
  useEffect(() => {
    return () => mediaCache.releaseVideos(urls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPaused(false);
    setBuffering(false);
    setShowIcon(false);
    const video = videoRef.current;
    if (video) video.play().catch(() => {});
    onIndexChange?.(index);
    return () => {
      if (iconTimer.current) clearTimeout(iconTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function goTo(next: number) {
    if (!hasMultiple) return;
    setIndex(((next % urls.length) + urls.length) % urls.length);
  }

  function flashIcon() {
    setShowIcon(true);
    if (iconTimer.current) clearTimeout(iconTimer.current);
    iconTimer.current = setTimeout(() => setShowIcon(false), 700);
  }

  function togglePlayPause(e: React.MouseEvent) {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
    flashIcon();
  }

  if (!urls?.length) {
    return (
      <div
        style={{ position: "absolute", inset: 0 }}
        className='bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center'>
        <span className='text-white/30 text-8xl font-black'>
          {name?.[0]?.toUpperCase()}
        </span>
      </div>
    );
  }

  const TAP_ZONE_BOTTOM = "30%";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 1,
        background: "#000",
      }}
      onTouchStart={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const t = e.touches[0];
        const relY = (t.clientY - rect.top) / rect.height;
        if (relY > 0.6) {
          touchStartRef.current = null;
          return;
        }
        touchStartRef.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        if (!touchStartRef.current || !hasMultiple) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartRef.current.x;
        const dy = t.clientY - touchStartRef.current.y;
        touchStartRef.current = null;
        if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
        goTo(index + (dx < 0 ? 1 : -1));
      }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "#000",
        }}>
        {broken ? (
          <div
            style={{ position: "absolute", inset: 0 }}
            className='bg-gradient-to-br from-[#1E3A8A]/80 to-[#0F172A] flex flex-col items-center justify-center gap-2'>
            <svg
              className='w-10 h-10 text-white/20'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={1.5}>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 18h16.5'
              />
            </svg>
            <p className='text-white/30 text-xs'>Media unavailable</p>
          </div>
        ) : currentIsVideo ? (
          <video
            ref={videoRef}
            key={current}
            src={mediaCache.getVideoSrc(current)}
            className='w-full h-full object-cover bg-black'
            muted
            loop
            playsInline
            preload='metadata'
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onCanPlay={() => setBuffering(false)}
            onError={() => setFailed((p) => new Set(p).add(index))}
          />
        ) : (
          <img
            key={current}
            src={current}
            alt={name}
            draggable={false}
            className='w-full h-full object-cover select-none bg-black/50 transition-opacity'
            onError={() => setFailed((p) => new Set(p).add(index))}
          />
        )}
      </div>

      {currentIsVideo && !broken && buffering && !paused && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4,
            pointerEvents: "none",
          }}>
          <div className='w-10 h-10 rounded-full border-2 border-white/25 border-t-white animate-spin' />
        </div>
      )}

      {currentIsVideo && !broken && showIcon && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 4,
            pointerEvents: "none",
          }}>
          <div className='w-16 h-16 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center'>
            {paused ? (
              <svg
                className='w-7 h-7 text-white translate-x-0.5'
                fill='currentColor'
                viewBox='0 0 24 24'>
                <path d='M8 5v14l11-7z' />
              </svg>
            ) : (
              <svg
                className='w-7 h-7 text-white'
                fill='currentColor'
                viewBox='0 0 24 24'>
                <path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z' />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "8rem",
          zIndex: 2,
          pointerEvents: "none",
        }}
        className='bg-gradient-to-b from-black/45 via-black/10 to-transparent'
      /> */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "40%",
          zIndex: 2,
          pointerEvents: "none",
        }}
        className='bg-gradient-to-t from-black/80 via-black/40 to-transparent'
      />

      {hasMultiple && (
        <div
          style={{
            position: "absolute",
            top: 72,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 6,
            pointerEvents: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "6px 8px",
            borderRadius: 999,
            background: "rgba(15, 23, 42, 0.38)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.28)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            width: "fit-content",
            maxWidth: "calc(100% - 32px)",
          }}>
          {urls.map((_, i) => (
            <div
              key={i}
              style={{
                flex: "none",
                width: 24,
                height: 4,
                borderRadius: 999,
                background: "rgba(255,255,255,0.24)",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.14)",
              }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 999,
                  background: "#fff",
                  boxShadow: "0 0 6px rgba(255,255,255,0.85)",
                  width: i <= index ? "100%" : "0%",
                  transition: "width 0.3s",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {hasMultiple && (
        <button
          type='button'
          aria-label='Previous media'
          onClick={(e) => {
            e.stopPropagation();
            goTo(index - 1);
          }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: TAP_ZONE_BOTTOM,
            width: "25%",
            zIndex: 5,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        />
      )}

      {currentIsVideo && !broken && (
        <button
          type='button'
          aria-label='Play or pause'
          onClick={togglePlayPause}
          style={{
            position: "absolute",
            left: "25%",
            right: "25%",
            top: 0,
            bottom: TAP_ZONE_BOTTOM,
            zIndex: 5,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        />
      )}

      {hasMultiple && (
        <button
          type='button'
          aria-label='Next media'
          onClick={(e) => {
            e.stopPropagation();
            goTo(index + 1);
          }}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: TAP_ZONE_BOTTOM,
            width: "25%",
            zIndex: 5,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        />
      )}
    </div>
  );
}
