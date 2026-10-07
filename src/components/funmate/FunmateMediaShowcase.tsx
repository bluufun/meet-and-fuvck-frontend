"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconChevronLeft } from "./Icons";
import { mediaCache } from "@/lib/mediaCache";
import { useMediaCacheVersion } from "@/lib/useMediaCacheVersion";

interface FunmateMediaShowcaseProps {
  urls: string[];
  name: string;
  onBack: () => void;
}

function isVideoUrl(url: string) {
  const lower = decodeURIComponent(url).toLowerCase();
  const clean = lower.split("?")[0];
  return (
    /\.(mp4|webm|mov|m4v)$/i.test(clean) ||
    /[?&](content-type|type)=video%2f/i.test(lower) ||
    lower.includes("video/")
  );
}

const AUTOPLAY_DELAY_MS = 3500;

export default function FunmateMediaShowcase({
  urls,
  name,
  onBack,
}: FunmateMediaShowcaseProps) {
  const mediaUrls = Array.from(
    new Set((urls ?? []).map((u) => u.trim()).filter(Boolean)),
  );
  return (
    <ShowcaseInner
      key={mediaUrls.join("|")}
      mediaUrls={mediaUrls}
      name={name}
      onBack={onBack}
    />
  );
}

function ShowcaseInner({
  mediaUrls,
  name,
  onBack,
}: {
  mediaUrls: string[];
  name: string;
  onBack: () => void;
}) {
  useMediaCacheVersion();

  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showSpeaker, setShowSpeaker] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mediaVisible, setMediaVisible] = useState(true);
  const [autoPaused, setAutoPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const expandedVideoRef = useRef<HTMLVideoElement | null>(null);
  const iconTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const hasMultiple = mediaUrls.length > 1;
  const current = mediaUrls[index];
  const broken = failed.has(index);
  const currentIsVideo = current ? isVideoUrl(current) : false;

  // Prefetch every media item for this profile as soon as the showcase mounts
  useEffect(() => {
    mediaCache.preloadAll(mediaUrls, isVideoUrl);
    return () => mediaCache.releaseMedia(mediaUrls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaUrls.join("|")]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsPlaying(true);
      setIsBuffering(false);
      setShowIcon(false);
      setMuted(true);
      setShowSpeaker(false);
      setMediaVisible(true);
      const video = videoRef.current;
      if (video) video.play().catch(() => {});
    });
    return () => {
      cancelAnimationFrame(frame);
      if (iconTimerRef.current) clearTimeout(iconTimerRef.current);
      if (speakerTimerRef.current) clearTimeout(speakerTimerRef.current);
    };
  }, [index]);

  useEffect(() => {
    if (!hasMultiple || currentIsVideo || expanded || autoPaused) return;

    const timer = window.setTimeout(() => {
      setIndex((currentIndex) => (currentIndex + 1) % mediaUrls.length);
    }, AUTOPLAY_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [
    autoPaused,
    currentIsVideo,
    expanded,
    hasMultiple,
    index,
    mediaUrls.length,
  ]);

  function goTo(next: number) {
    setIndex(Math.max(0, Math.min(next, mediaUrls.length - 1)));
  }

  function flashIcon() {
    setShowIcon(true);
    if (iconTimerRef.current) clearTimeout(iconTimerRef.current);
    iconTimerRef.current = setTimeout(() => setShowIcon(false), 550);
  }

  function revealSpeaker() {
    setShowSpeaker(true);
    if (speakerTimerRef.current) clearTimeout(speakerTimerRef.current);
    speakerTimerRef.current = setTimeout(() => setShowSpeaker(false), 3000);
  }

  function openExpanded() {
    setExpanded(true);
  }

  function closeExpanded() {
    setExpanded(false);
  }

  function advance(delta: number) {
    if (!hasMultiple) return;
    goTo(index + delta);
  }

  function advanceCarousel(delta: number) {
    if (!hasMultiple) return;
    setIndex(
      (currentIndex) =>
        (currentIndex + delta + mediaUrls.length) % mediaUrls.length,
    );
  }

  function togglePlayPause() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    flashIcon();
    revealSpeaker();
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    setMuted((m) => !m);
    revealSpeaker();
  }

  return (
    <div
      className='relative overflow-hidden bg-black'
      style={{ aspectRatio: "4 / 5", position: "relative" }}
      onTouchStart={(e) => {
        const t = e.touches[0];
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
      }}
      onMouseEnter={() => setAutoPaused(true)}
      onMouseLeave={() => setAutoPaused(false)}
      onFocus={() => setAutoPaused(true)}
      onBlur={() => setAutoPaused(false)}>
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-500 ease-out ${
          mediaVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ pointerEvents: "none" }}>
        {!current ? (
          <div className='w-full h-full bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center'>
            <span className='text-white/30 text-7xl font-black'>
              {name?.[0]?.toUpperCase()}
            </span>
          </div>
        ) : broken ? (
          <div className='w-full h-full bg-[#1E293B] flex items-center justify-center'>
            <span className='text-white/30 text-xs'>Media unavailable</span>
          </div>
        ) : currentIsVideo ? (
          <video
            ref={videoRef}
            key={current}
            src={mediaCache.getVideoSrc(current)}
            className='w-full h-full object-cover bg-black'
            muted={muted}
            playsInline
            preload='metadata'
            onEnded={() => advanceCarousel(1)}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onCanPlay={() => setIsBuffering(false)}
            onError={() => setFailed((p) => new Set(p).add(index))}
          />
        ) : (
          <img
            key={current}
            src={current}
            alt={name}
            draggable={false}
            className='w-full h-full object-cover select-none bg-black'
            onError={() => setFailed((p) => new Set(p).add(index))}
          />
        )}
      </div>

      {currentIsVideo && !broken && isBuffering && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            pointerEvents: "none",
          }}>
          <div className='w-10 h-10 border-[3px] border-white/25 border-t-white rounded-full animate-spin' />
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
            zIndex: 20,
            pointerEvents: "none",
          }}>
          <div className='w-14 h-14 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center'>
            {isPlaying ? (
              <svg
                className='w-6 h-6 text-white'
                fill='currentColor'
                viewBox='0 0 24 24'>
                <path d='M6 5h4v14H6zM14 5h4v14h-4z' />
              </svg>
            ) : (
              <svg
                className='w-6 h-6 text-white translate-x-[1px]'
                fill='currentColor'
                viewBox='0 0 24 24'>
                <path d='M8 5v14l11-7z' />
              </svg>
            )}
          </div>
        </div>
      )}

      {currentIsVideo && !broken && !isPlaying && !showIcon && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            pointerEvents: "none",
          }}>
          <div className='w-14 h-14 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center'>
            <svg
              className='w-6 h-6 text-white translate-x-[1px]'
              fill='currentColor'
              viewBox='0 0 24 24'>
              <path d='M8 5v14l11-7z' />
            </svg>
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          zIndex: 5,
          pointerEvents: "none",
        }}
        className=''
      />

      <button
        type='button'
        onClick={onBack}
        aria-label='Go back'
        style={{ position: "absolute", top: 16, left: 16, zIndex: 40 }}
        className='w-9 h-9 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white'>
        <IconChevronLeft className='w-5 h-5' />
      </button>

      <button
        type='button'
        onClick={openExpanded}
        aria-label='Expand media'
        style={{ position: "absolute", right: 16, bottom: 16, zIndex: 40 }}
        className='w-10 h-10 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white transition hover:bg-black/50 active:scale-95'>
        <svg
          viewBox='0 0 24 24'
          fill='none'
          className='w-5 h-5'
          stroke='currentColor'
          strokeWidth={2}>
          <path strokeLinecap='round' strokeLinejoin='round' d='M15 3h6v6' />
          <path strokeLinecap='round' strokeLinejoin='round' d='M9 21H3v-6' />
          <path strokeLinecap='round' strokeLinejoin='round' d='M21 3l-7 7' />
          <path strokeLinecap='round' strokeLinejoin='round' d='M3 21l7-7' />
        </svg>
      </button>

      {currentIsVideo && !broken && (
        <button
          type='button'
          aria-label={muted ? "Unmute video" : "Mute video"}
          onClick={toggleMute}
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            zIndex: 35,
            width: 36,
            height: 36,
            borderRadius: "9999px",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            opacity: showSpeaker ? 1 : 0,
            pointerEvents: showSpeaker ? "auto" : "none",
            transition: "opacity 0.25s ease",
          }}>
          {muted ? (
            <svg
              className='w-4 h-4 text-white'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth={1.8}>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M11 5L6 9H3v6h3l5 4V5z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M16 9l5 6M21 9l-5 6'
              />
            </svg>
          ) : (
            <svg
              className='w-4 h-4 text-white'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth={1.8}>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M11 5L6 9H3v6h3l5 4V5z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12'
              />
            </svg>
          )}
        </button>
      )}

      {hasMultiple && (
        <button
          type='button'
          aria-label='Previous media'
          onClick={() => goTo(index - 1)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "30%",
            zIndex: 30,
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
            left: "30%",
            top: 0,
            bottom: 0,
            width: "40%",
            zIndex: 30,
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
          onClick={() => goTo(index + 1)}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "30%",
            zIndex: 30,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        />
      )}

      {hasMultiple && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 25,
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
          {mediaUrls.map((_, i) => (
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

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 96,
          zIndex: 5,
          pointerEvents: "none",
        }}
        className='bg-gradient-to-t from-black/55 to-transparent'
      />

      {expanded &&
        createPortal(
          <div
            className='fixed inset-0 z-[90] bg-black/95'
            onClick={closeExpanded}>
            <div
              className='absolute inset-0'
              onTouchStart={(e) => {
                const t = e.touches[0];
                touchStartRef.current = { x: t.clientX, y: t.clientY };
              }}
              onTouchEnd={(e) => {
                if (!touchStartRef.current || !hasMultiple) return;
                const t = e.changedTouches[0];
                const dx = t.clientX - touchStartRef.current.x;
                const dy = t.clientY - touchStartRef.current.y;
                touchStartRef.current = null;
                if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.4)
                  return;
                advance(dx < 0 ? 1 : -1);
              }}>
              <div className='absolute inset-0 flex items-center justify-center p-4 sm:p-6'>
                <div className='relative flex h-full w-full items-center justify-center'>
                  <div className='relative flex h-full w-full max-w-6xl items-center justify-center overflow-hidden rounded-[2rem]'>
                    {currentIsVideo && !broken ? (
                      <video
                        ref={expandedVideoRef}
                        key={`expanded-${current}`}
                        src={mediaCache.getVideoSrc(current)}
                        className='h-full w-full object-contain bg-black'
                        muted={muted}
                        playsInline
                        controls={false}
                        autoPlay
                        preload='metadata'
                        onEnded={() => advanceCarousel(1)}
                        onWaiting={() => setIsBuffering(true)}
                        onPlaying={() => setIsBuffering(false)}
                        onCanPlay={() => setIsBuffering(false)}
                        onError={() => setFailed((p) => new Set(p).add(index))}
                      />
                    ) : current && !broken ? (
                      <img
                        src={current}
                        alt={name}
                        className='h-full w-full object-contain select-none bg-black'
                        draggable={false}
                        onError={() => setFailed((p) => new Set(p).add(index))}
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center bg-[#111827] text-white/60'>
                        <span className='text-sm'>Media unavailable</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  closeExpanded();
                }}
                className='absolute right-4 top-4 z-[95] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20'
                aria-label='Close viewer'>
                <svg
                  viewBox='0 0 24 24'
                  fill='none'
                  className='h-5 w-5'
                  stroke='currentColor'
                  strokeWidth={2.5}>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M6 18L18 6'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M6 6l12 12'
                  />
                </svg>
              </button>

              {hasMultiple && (
                <>
                  <button
                    type='button'
                    aria-label='Previous media'
                    onClick={(e) => {
                      e.stopPropagation();
                      advance(-1);
                    }}
                    className='absolute left-0 top-0 z-[94] h-full w-1/2 bg-transparent'
                  />
                  <button
                    type='button'
                    aria-label='Next media'
                    onClick={(e) => {
                      e.stopPropagation();
                      advance(1);
                    }}
                    className='absolute right-0 top-0 z-[94] h-full w-1/2 bg-transparent'
                  />
                </>
              )}

              {hasMultiple && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 96,
                    pointerEvents: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px 10px",
                    borderRadius: 999,
                    background: "rgba(15, 23, 42, 0.4)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.16)",
                    width: "fit-content",
                    maxWidth: "calc(100% - 32px)",
                  }}>
                  {mediaUrls.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: "none",
                        width: 28,
                        height: 4,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.24)",
                        overflow: "hidden",
                      }}>
                      <div
                        style={{
                          height: "100%",
                          width: i === index ? "100%" : "0%",
                          borderRadius: 999,
                          background: "#fff",
                          transition: "width 0.25s",
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
