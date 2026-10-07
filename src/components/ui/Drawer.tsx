"use client";

import { useEffect } from "react";

export default function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      className='fixed inset-0 z-[80]'
      style={{ pointerEvents: open ? "auto" : "none" }}
      aria-hidden={!open}>
      <div
        onClick={onClose}
        className='absolute inset-0 bg-slate-950/20 backdrop-blur-md transition-opacity duration-300'
        style={{ opacity: open ? 1 : 0 }}
      />
      {/* Mobile: full-width bottom sheet. Desktop: centered modal card. */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className={`absolute left-0 right-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white px-5 pb-8 pt-4 text-slate-900 transition-all duration-300 ease-out xl:left-1/2 xl:right-auto xl:top-1/2 xl:bottom-auto xl:max-h-[80vh] xl:w-full xl:max-w-[440px] xl:-translate-x-1/2 xl:rounded-3xl xl:border xl:border-slate-200 xl:px-6 xl:pb-6 xl:pt-5 xl:shadow-[0_30px_80px_rgba(15,23,42,0.18)] ${
          open
            ? "translate-y-0 xl:-translate-y-1/2 xl:opacity-100"
            : "translate-y-full xl:-translate-y-[45%] xl:opacity-0"
        }`}>
        <div className='mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 xl:hidden' />
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-bold text-slate-900'>{title}</h2>
          <button
            onClick={onClose}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900'
            aria-label='Close'>
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
