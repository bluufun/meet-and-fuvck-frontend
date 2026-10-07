"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { DiscoverFilterState } from "./DiscoverFilterDrawer";

const FILTER_LABELS: { key: keyof DiscoverFilterState; label: string }[] = [
  { key: "state", label: "State" },
  { key: "lga", label: "City" },
  { key: "gender", label: "Gender" },
  { key: "orientation", label: "Orientation" },
];

function activeChips(filters: DiscoverFilterState) {
  const chips: {
    id: string;
    label: string;
    clear: Partial<DiscoverFilterState>;
  }[] = [];
  for (const { key, label } of FILTER_LABELS) {
    if (filters[key])
      chips.push({
        id: key,
        label: `${label}: ${filters[key]}`,
        // Changing state invalidates the chosen city, same as the drawer does.
        clear: key === "state" ? { state: "", lga: "" } : { [key]: "" },
      });
  }
  if (filters.minAge || filters.maxAge) {
    const age =
      filters.minAge && filters.maxAge
        ? `${filters.minAge}–${filters.maxAge}`
        : filters.minAge
          ? `${filters.minAge}+`
          : `up to ${filters.maxAge}`;
    chips.push({
      id: "age",
      label: `Age: ${age}`,
      clear: { minAge: "", maxAge: "" },
    });
  }
  return chips;
}

export function countActiveFilters(filters: DiscoverFilterState) {
  return Object.values(filters).filter(Boolean).length;
}

export default function DiscoverSearchBar({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  onOpenFilters,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  filters: DiscoverFilterState;
  onFiltersChange: (f: DiscoverFilterState) => void;
  onOpenFilters: () => void;
}) {
  const count = countActiveFilters(filters);
  const chips = activeChips(filters);

  return (
    <div className='mb-4'>
      <div className='flex items-center gap-2.5'>
        <div className='relative min-w-0 flex-1'>
          <Search
            aria-hidden
            className='pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400'
          />
          <input
            type='search'
            inputMode='search'
            enterKeyHint='search'
            autoComplete='off'
            autoCorrect='off'
            spellCheck={false}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) onQueryChange("");
              if (e.key === "Enter") e.currentTarget.blur(); // closes the mobile keyboard
            }}
            placeholder='Search by name, city or vibe'
            aria-label='Search funmates'
            className='h-11 w-full rounded-full border border-slate-900/[0.08] bg-white pl-10 pr-10 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1E3A8A]/40 focus:ring-4 focus:ring-[#1E3A8A]/10 [&::-webkit-search-cancel-button]:hidden'
          />
          {query && (
            <button
              type='button'
              onClick={() => onQueryChange("")}
              aria-label='Clear search'
              className='absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700'>
              <X className='h-4 w-4' />
            </button>
          )}
        </div>

        <button
          type='button'
          onClick={onOpenFilters}
          aria-label={
            count > 0 ? `Open filters, ${count} applied` : "Open filters"
          }
          className={`relative flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold shadow-sm transition active:scale-95 ${
            count > 0
              ? "border-[#1E3A8A] bg-[#1E3A8A] text-white hover:bg-[#163172]"
              : "border-slate-900/[0.08] bg-white text-slate-700 hover:shadow-md"
          }`}>
          <SlidersHorizontal className='h-4 w-4' />
          <span className='hidden min-[400px]:inline'>Filters</span>
          {count > 0 && (
            <span className='flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold leading-none text-[#1E3A8A]'>
              {count}
            </span>
          )}
        </button>
      </div>

      {chips.length > 0 && (
        <div
          className='mt-2.5 flex items-center gap-2 overflow-x-auto pb-1'
          style={{ scrollbarWidth: "none" }}>
          {chips.map((chip) => (
            <button
              key={chip.id}
              type='button'
              onClick={() => onFiltersChange({ ...filters, ...chip.clear })}
              aria-label={`Remove filter ${chip.label}`}
              className='inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1E3A8A]/[0.08] py-1 pl-3 pr-2 text-[12px] font-semibold text-[#1E3A8A] transition hover:bg-[#1E3A8A]/[0.14]'>
              {chip.label}
              <X className='h-3.5 w-3.5' />
            </button>
          ))}
          {chips.length > 1 && (
            <button
              type='button'
              onClick={() =>
                onFiltersChange({
                  state: "",
                  lga: "",
                  gender: "",
                  orientation: "",
                  minAge: "",
                  maxAge: "",
                })
              }
              className='shrink-0 px-1 text-[12px] font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-800'>
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
