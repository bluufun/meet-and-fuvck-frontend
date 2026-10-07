"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BoostTier, isGoldTier } from "@/lib/boostTiers";
import TierChip from "@/components/TierBadge";
import VerifiedBadge from "./VerifiedBadge";
import CardCarousel from "./CardCarousel";
import { capitalize } from "@/lib/capitalize";

interface Funmate {
  _id: string;
  name: string;
  username: string;
  age?: number;
  lga?: string;
  state?: string;
  boostTier: BoostTier;
  isVerified?: boolean;
  mediaUrls: string[];
  experiences?: string[];
  vibeBio?: string;
  currentWant?: string;
}

const MAX_CHIPS = 4;

const WANT_LABELS: Record<string, string> = {
  just_chilling: "Just chilling",
  meet_asap: "Ready to meet",
  good_convo: "Good conversation",
  weekend_plan: "Weekend plans",
  travel_buddy: "Travel buddy",
  date_night: "Date night",
  gym_partner: "Gym partner",
  movie_night: "Movie night",
  emotional_support: "Emotional support",
  networking_now: "Networking",
  exploring: "Just exploring",
  serious_connection: "Serious connection",
};

export default function FunmateCard({
  funmate,
  active = true,
  onOpenProfile,
}: {
  funmate: Funmate;
  active?: boolean;
  onOpenProfile?: () => void;
}) {
  const router = useRouter();
  const [bioExpanded, setBioExpanded] = useState(false);

  const urls = funmate.mediaUrls ?? [];
  const chips = (funmate.experiences ?? []).slice(0, MAX_CHIPS);
  const extra = (funmate.experiences?.length ?? 0) - MAX_CHIPS;
  const location = [funmate.lga, funmate.state].filter(Boolean).join(", ");
  const bioIsLong = (funmate.vibeBio?.length ?? 0) > 90;

  function goToProfile() {
    onOpenProfile?.();
    router.push(`/funmate/${encodeURIComponent(funmate.username)}`);
  }
  return (
    <div
      className='absolute inset-0'
      style={{ isolation: "isolate" }}
      onClick={goToProfile}>
      <div className='absolute inset-0' style={{ zIndex: 1 }}>
        <CardCarousel urls={urls} name={funmate.name} active={active} />
      </div>

      <div
        className='absolute bottom-5 left-0 right-0 px-3 pb-1 pt-10 pointer-events-none'
        style={{ zIndex: 3 }}>
        <Link
          href={`/funmate/${encodeURIComponent(funmate.username)}`}
          className='block pointer-events-auto cursor-pointer'
          onClick={(e) => e.stopPropagation()}>
          <div className='flex items-center gap-2 flex-wrap mb-1'>
            <h3 className='text-white font-bold text-xl leading-tight [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]'>
              {capitalize(funmate.username)}
            </h3>
            {funmate.age && (
              <span className='text-white/90 font-medium text-base [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]'>
                {funmate.age}
              </span>
            )}
            {funmate.isVerified && (
              <VerifiedBadge
                golden={isGoldTier(funmate.boostTier)}
                className='w-4 h-4'
              />
            )}
            {funmate.boostTier !== "regular" && (
              <TierChip tier={funmate.boostTier} size='md' variant='overlay' />
            )}
          </div>

          {location && (
            <div className='flex items-center gap-1 mb-2'>
              <svg
                className='w-3.5 h-3.5 text-white shrink-0'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={2}>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                />
              </svg>
              <span className='text-white font-medium text-xs [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]'>
                {location}
              </span>
            </div>
          )}

          {funmate.currentWant && WANT_LABELS[funmate.currentWant] && (
            <div className='inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-sm border border-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-2'>
              <span className='w-1.5 h-1.5 rounded-full bg-[#60A5FA] animate-pulse shrink-0' />
              {WANT_LABELS[funmate.currentWant]}
            </div>
          )}

          {chips.length > 0 && (
            <div className='flex flex-wrap gap-1.5 mb-2'>
              {chips.map((exp) => (
                <span
                  key={exp}
                  className='text-[11px] font-medium text-white bg-black/20 backdrop-blur-sm border border-white/15 px-2.5 py-1 rounded-full'>
                  {exp.replace(/_/g, " ")}
                </span>
              ))}
              {extra > 0 && (
                <span className='text-[11px] text-white px-1 py-1'>
                  +{extra} more
                </span>
              )}
            </div>
          )}
        </Link>

        {funmate.vibeBio && (
          <p className='text-white text-sm leading-relaxed max-w-[90%] truncate [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]'>
            {funmate.vibeBio}
          </p>
        )}
      </div>
    </div>
  );
}
