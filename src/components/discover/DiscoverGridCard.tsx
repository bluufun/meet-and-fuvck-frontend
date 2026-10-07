"use client";

import { useRouter } from "next/navigation";
import { capitalize } from "@/lib/capitalize";
import { isGoldTier } from "@/lib/boostTiers";
import TierChip from "@/components/TierBadge";
import { getCoverMedia } from "@/lib/mediaType";
import VerifiedBadge from "@/components/landing/VerifiedBadge";
import type { DiscoverFunmate } from "./types";

// Single source of truth for the info-panel colour. The photo's bottom fade
// and the panel itself both use it, so the seam between image and text is
// invisible: the photo dissolves *into* the panel instead of being cut off.
const PANEL = "#0B1222";

function PinIcon() {
  return (
    <svg
      className='h-3 w-3 shrink-0'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      viewBox='0 0 24 24'
      aria-hidden>
      <path d='M17.7 16.7 13.4 21a2 2 0 0 1-2.8 0l-4.3-4.3a8 8 0 1 1 11.4 0z' />
      <circle cx='12' cy='11' r='3' />
    </svg>
  );
}

export default function DiscoverGridCard({
  funmate,
}: {
  funmate: DiscoverFunmate;
}) {
  const router = useRouter();
  const cover = getCoverMedia(funmate.mediaUrls);
  const gold = isGoldTier(funmate.boostTier);
  const profileHref = `/funmate/${encodeURIComponent(funmate.username)}`;
  // Older profiles (from before the LGA-based location picker) may only
  // have the legacy city field set, not lga — fall back so they still show
  // a real city name instead of just the state alone.
  const location = [funmate.lga || funmate.city, funmate.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      role='button'
      tabIndex={0}
      aria-label={`View ${capitalize(funmate.username)}'s profile`}
      onMouseEnter={() => router.prefetch(profileHref)}
      onClick={() => router.push(profileHref)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(profileHref);
      }}
      style={{ backgroundColor: PANEL }}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-[20px] ring-1 shadow-[0_10px_24px_-12px_rgba(15,23,42,0.45)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-14px_rgba(15,23,42,0.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A] ${
        gold ? "ring-amber-400/30" : "ring-white/[0.06]"
      }`}>
      {/* Photo */}
      <div className='relative aspect-[4/5] w-full overflow-hidden'>
        {cover ? (
          cover.isVideo ? (
            <video
              className='absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]'
              src={cover.url}
              muted
              playsInline
              preload='metadata'
            />
          ) : (
            <img
              className='absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]'
              src={cover.url}
              alt={capitalize(funmate.username)}
              loading='lazy'
              decoding='async'
            />
          )
        ) : (
          <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#080808] to-[#1b1c1e] text-3xl font-black text-white/70'>
            {funmate.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}

        {/* Fade the photo into the info panel below */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-x-0 bottom-0 h-[55%]'
          style={{
            background: `linear-gradient(180deg, rgba(11,18,34,0) 0%, rgba(11,18,34,0.55) 45%, rgba(11,18,34,0.95) 80%, ${PANEL} 100%)`,
          }}
        />

        {funmate.boostTier !== "regular" && (
          <TierChip
            tier={funmate.boostTier}
            size='md'
            variant='overlay'
            className='absolute left-2 top-2'
          />
        )}
      </div>

      {/* Info panel — overlaps the faded photo edge so the two read as one */}
      <div className='relative -mt-20 flex flex-1 flex-col px-3.5 pb-4 text-white'>
        <div className='flex min-w-0 items-center gap-1.5'>
          <span className='truncate text-[16px] font-semibold leading-tight tracking-tight'>
            {capitalize(funmate.username)}
          </span>
          {funmate.age ? (
            <span className='shrink-0 text-[14px] font-normal text-slate-300'>
              {funmate.age}
            </span>
          ) : null}
          {funmate.isVerified && (
            <VerifiedBadge golden={gold} className='h-3.5 w-3.5 shrink-0' />
          )}
        </div>

        {location && (
          <div className='mt-1 flex min-w-0 items-center gap-1 text-[11.5px] text-slate-400'>
            <PinIcon />
            <span className='truncate'>{location}</span>
          </div>
        )}

        {funmate.vibeBio && (
          <p className='mt-2 line-clamp-2 border-t border-white/[0.08] pt-2 text-[12px] leading-[1.45] text-slate-300/85'>
            {funmate.vibeBio}
          </p>
        )}
      </div>
    </div>
  );
}
