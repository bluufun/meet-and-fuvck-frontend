"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { NIGERIA_STATES, getLGAs } from "@/lib/nigeria-locations";
import { GENDERS, ORIENTATIONS } from "@/lib/profileOptions";

export interface DiscoverFilterState {
  state: string;
  lga: string;
  gender: string;
  orientation: string;
  minAge: string;
  maxAge: string;
}

export const DISCOVER_FILTER_INITIAL: DiscoverFilterState = {
  state: "",
  lga: "",
  gender: "",
  orientation: "",
  minAge: "",
  maxAge: "",
};

function subscribeNoop() {
  return () => {};
}

/** True once mounted on the client, false during SSR/initial hydration. */
function useMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true, // client snapshot
    () => false, // server snapshot
  );
}

function subscribeMediaQuery(query: string) {
  return (callback: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", callback);
    return () => mq.removeEventListener("change", callback);
  };
}

/** Live-updating match state for a media query, SSR-safe. */
function useMediaQuery(query: string) {
  return useSyncExternalStore(
    subscribeMediaQuery(query),
    () => window.matchMedia(query).matches, // client snapshot
    () => false, // server snapshot
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[] | string[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500'>
        {label}
      </label>
      <div className='relative'>
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className='w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40'>
          <option value=''>{placeholder}</option>
          {options.map((opt) => {
            const id = typeof opt === "string" ? opt : opt.id;
            const lbl = typeof opt === "string" ? opt : opt.label;
            return (
              <option key={id} value={id}>
                {lbl}
              </option>
            );
          })}
        </select>
        <span className='pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400'>
          <svg
            className='h-4 w-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M19 9l-7 7-7-7'
            />
          </svg>
        </span>
      </div>
    </div>
  );
}

export default function DiscoverFilterDrawer({
  open,
  onClose,
  initialFilters,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  initialFilters: DiscoverFilterState;
  onApply: (filters: DiscoverFilterState) => void;
}) {
  const [filters, setFilters] = useState<DiscoverFilterState>(initialFilters);

  // Keep local draft in sync whenever the drawer is (re)opened with fresh
  // upstream filters (e.g. cleared elsewhere on the page). Adjusting state
  // during render (comparing against the previous `open` value) instead of
  // in an effect avoids the extra render pass.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setFilters(initialFilters);
    }
  }

  const mounted = useMounted();
  const isDesktop = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    if (!open || !isDesktop) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDesktop, onClose, open]);

  const stateNames = NIGERIA_STATES.map((s) => s.state);
  const lgas = filters.state ? getLGAs(filters.state) : [];

  function update<K extends keyof DiscoverFilterState>(key: K, value: string) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "state" ? { lga: "" } : {}),
    }));
  }

  function handleApply() {
    onApply(filters);
    onClose();
  }

  function handleClear() {
    setFilters(DISCOVER_FILTER_INITIAL);
    onApply(DISCOVER_FILTER_INITIAL);
    onClose();
  }

  const activeCount = Object.values(filters).filter(Boolean).length;

  const fields = (
    <div className='space-y-4'>
      <Select
        label='State'
        value={filters.state}
        onChange={(v) => update("state", v)}
        options={stateNames}
        placeholder='Any state'
      />

      <Select
        label='City'
        value={filters.lga}
        onChange={(v) => update("lga", v)}
        options={lgas}
        placeholder={filters.state ? "Any City" : "Select a state first"}
        disabled={!filters.state}
      />

      <Select
        label='Gender'
        value={filters.gender}
        onChange={(v) => update("gender", v)}
        options={GENDERS}
        placeholder='Any gender'
      />

      <Select
        label='Sexual orientation'
        value={filters.orientation}
        onChange={(v) => update("orientation", v)}
        options={ORIENTATIONS}
        placeholder='Any orientation'
      />

      <div>
        <label className='mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500'>
          Age range
        </label>
        <div className='flex items-center gap-3 mb-3'>
          <input
            type='number'
            placeholder='Min'
            value={filters.minAge}
            onChange={(e) => update("minAge", e.target.value)}
            className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400'
          />
          <span className='text-slate-400'>to</span>
          <input
            type='number'
            placeholder='Max'
            value={filters.maxAge}
            onChange={(e) => update("maxAge", e.target.value)}
            className='w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400'
          />
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className='flex items-center gap-3'>
      <button
        type='button'
        onClick={handleClear}
        className='flex-1 rounded-xl border border-slate-200 bg-slate-100 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200'>
        Clear
      </button>
      <button
        type='button'
        onClick={handleApply}
        className='flex-[2] rounded-xl bg-[#1E3A8A] py-3 text-sm font-bold text-white transition hover:bg-[#163172]'>
        Apply filters{activeCount > 0 ? ` (${activeCount})` : ""}
      </button>
    </div>
  );

  if (!mounted) return null;

  if (isDesktop) {
    return createPortal(
      <div
        className='fixed inset-0 z-[80]'
        aria-hidden={!open}
        style={{ pointerEvents: open ? "auto" : "none" }}>
        <div
          onClick={onClose}
          className='absolute inset-0 bg-slate-950/20 backdrop-blur-md transition-opacity duration-300'
          style={{ opacity: open ? 1 : 0 }}
        />
        <aside
          onClick={(event) => event.stopPropagation()}
          className='absolute right-4 bottom-0 flex h-[min(86vh,760px)] w-[min(980px,calc(100vw-50rem))] flex-col overflow-hidden rounded-t-[2rem] border border-slate-200 bg-white shadow-[0_-24px_80px_rgba(15,23,42,0.16)] transition-transform duration-300 ease-out'
          style={{ transform: open ? "translateY(0)" : "translateY(102%)" }}>
          <div className='shrink-0 border-b border-slate-100 px-6 pb-4 pt-5'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400'>
                  Filter funmates
                </p>
                <p className='mt-2 text-sm leading-6 text-slate-600'>
                  Narrow down who shows up in Discover.
                </p>
              </div>
              <button
                type='button'
                onClick={onClose}
                className='flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900'
                aria-label='Close filters'>
                <X className='h-4 w-4' />
              </button>
            </div>
          </div>
          <div className='min-h-0 flex-1 overflow-y-auto px-6 py-5'>
            {fields}
          </div>
          <div className='shrink-0 border-t border-slate-100 bg-white px-6 py-4'>
            {footer}
          </div>
        </aside>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <Drawer open={open} onClose={onClose} title='Filter funmates'>
      <>
        {fields}
        {footer}
      </>
    </Drawer>,
    document.body,
  );
}
