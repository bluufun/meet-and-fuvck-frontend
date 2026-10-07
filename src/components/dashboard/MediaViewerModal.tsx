"use client";

import { useEffect, useState } from "react";

interface MediaItem { key: string; url: string; isVideo: boolean; }

interface MediaViewerModalProps {
  items: MediaItem[];
  startIndex: number;
  onClose: () => void;
}

export default function MediaViewerModal({ items, startIndex, onClose }: MediaViewerModalProps) {
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const current = items[index];

  useEffect(() => {
    setZoomed(false);
    setOffset({ x: 0, y: 0 });
  }, [index]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, items.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, onClose]);

  function handleMouseDown(e: React.MouseEvent) {
    if (!zoomed) return;
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }
  function handleMouseUp() {
    setDragging(false);
  }

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: "rgba(5,8,20,0.92)" }}>
      <button onClick={onClose} className="absolute top-5 right-5 text-white/80 hover:text-white text-2xl leading-none z-10">✕</button>

      {items.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            disabled={index === 0}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30 z-10"
          >‹</button>
          <button
            onClick={() => setIndex((i) => Math.min(i + 1, items.length - 1))}
            disabled={index === items.length - 1}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30 z-10"
          >›</button>
        </>
      )}

      <div className="absolute top-5 left-5 text-white/60 text-xs font-medium z-10">
        {index + 1} / {items.length}
      </div>

      <div
        className="w-full h-full flex items-center justify-center overflow-hidden px-4"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {current.isVideo ? (
          <video
            src={current.url}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="max-h-[85vh] max-w-full rounded-xl shadow-2xl"
          />
        ) : (
          <img
            src={current.url}
            alt="media"
            loading="eager"
            decoding="async"
            onMouseDown={handleMouseDown}
            onClick={() => !dragging && setZoomed((z) => !z)}
            draggable={false}
            style={{
              transform: `scale(${zoomed ? 2.2 : 1}) translate(${offset.x / (zoomed ? 2.2 : 1)}px, ${offset.y / (zoomed ? 2.2 : 1)}px)`,
              cursor: zoomed ? (dragging ? "grabbing" : "grab") : "zoom-in",
              transition: dragging ? "none" : "transform 0.25s ease",
            }}
            className="max-h-[85vh] max-w-full rounded-xl shadow-2xl select-none"
          />
        )}
      </div>

      {!current.isVideo && (
        <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-xs">
          Tap image to {zoomed ? "zoom out" : "zoom in"} {zoomed && "· drag to pan"}
        </p>
      )}
    </div>
  );
}
