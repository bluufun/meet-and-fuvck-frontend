"use client";

import { useState } from "react";
import { Menu, SlidersHorizontal } from "lucide-react";
import FilterDrawer from "@/components/landing/FilterDrawer";
import MobileMenuPanel from "@/components/landing/MobileMenuPanel";

type Tab = "for_you" | "premium" | "regular";

const TABS: { id: Tab; label: string }[] = [
  { id: "for_you", label: "For You" },
  { id: "premium", label: "Premium" },
  { id: "regular", label: "Regular" },
];

export default function TopBar({
  tab,
  onTabChange,
}: {
  tab: Tab;
  onTabChange: (t: Tab) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <>
      <div className='absolute left-0 right-0 top-0 z-50 px-3 pt-3'>
        <div className='grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2'>
          <button
            type='button'
            onClick={() => setMenuOpen(true)}
            className='flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/20 text-white shadow-lg shadow-black/10 backdrop-blur-md transition hover:bg-slate-950/35 active:scale-95 lg:hidden'
            aria-label='Open menu'>
            <Menu className='h-4 w-4' />
          </button>
          <div className='hidden h-10 w-10 lg:block' aria-hidden='true' />

          <div className='mx-auto flex w-full max-w-[240px] items-center rounded-full border border-white/15 bg-slate-950/18 p-1 shadow-lg shadow-black/10 backdrop-blur-md'>
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => onTabChange(item.id)}
                  className={`flex-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold tracking-tight transition ${
                    active
                      ? "bg-white text-slate-950 shadow-sm shadow-black/10"
                      : "text-white/72 hover:text-white"
                  }`}>
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            type='button'
            onClick={() => setFilterOpen(true)}
            className='flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/20 text-white shadow-lg shadow-black/10 backdrop-blur-md transition hover:bg-slate-950/35 active:scale-95'
            aria-label='Open filters'>
            <SlidersHorizontal className='h-4 w-4' />
          </button>
        </div>
      </div>

      <MobileMenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} />
    </>
  );
}
