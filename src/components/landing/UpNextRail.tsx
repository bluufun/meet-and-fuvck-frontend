"use client";

// Desktop-only (lg:+) right rail. Fixed at w-[360px] — paired with
// DesktopSidebar's w-24 (96px) in the horizontal centering math used by the
// feed card in LandingPageClient.tsx (`lg:left-[calc(50vw_-_132px)]`, where
// 132 = (360 - 96) / 2). If either width changes, update that calc too.

import { capitalize } from "@/lib/capitalize";
import VerifiedBadge from "./VerifiedBadge";

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
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url);
}

export default function UpNextRail({
  funmates,
  idx,
  onSelect,
}: {
  funmates: Funmate[];
  idx: number;
  onSelect: (index: number) => void;
}) {
  const upcoming = funmates.map((fm, i) => ({ fm, i })).slice(idx + 1, idx + 7);

  return (
    <aside className='fixed right-0 top-0 bottom-0 z-30 hidden w-[360px] flex-col border-l border-slate-200 bg-white lg:flex'>
      <div className='border-b border-slate-100 px-6 pb-5 pt-8'>
        <h2 className='text-[15px] font-bold text-slate-900'>Up next</h2>
        <p className='mt-0.5 text-[12.5px] text-slate-400'>
          The next funmates in this feed
        </p>
      </div>

      <div className='flex-1 overflow-y-auto px-3 py-3'>
        {upcoming.length === 0 ? (
          <p className='px-4 py-8 text-center text-[13px] leading-relaxed text-slate-400'>
            You&apos;re caught up for now — more funmates load in as you keep
            going.
          </p>
        ) : (
          upcoming.map(({ fm, i }) => {
            const thumb =
              (fm.mediaUrls ?? []).find((u) => !isVideoUrl(u)) ??
              fm.mediaUrls?.[0];
            const location = [fm.lga, fm.state].filter(Boolean).join(", ");

            return (
              <button
                key={fm._id}
                type='button'
                onClick={() => onSelect(i)}
                className='flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-slate-50'>
                {thumb ? (
                  <img
                    src={thumb}
                    alt=''
                    className='h-14 w-14 shrink-0 rounded-2xl object-cover'
                  />
                ) : (
                  <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-lg font-black text-white/70'>
                    {fm.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className='min-w-0'>
                  <div className='flex items-center gap-1.5'>
                    <span className='truncate text-[13.5px] font-bold text-slate-900'>
                      {capitalize(fm.username)}
                    </span>
                    {fm.age && (
                      <span className='text-[12.5px] text-slate-400'>
                        {fm.age}
                      </span>
                    )}
                    {fm.isVerified && <VerifiedBadge className='h-3.5 w-3.5' />}
                  </div>
                  {location && (
                    <p className='truncate text-[12px] text-slate-400'>
                      {location}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
