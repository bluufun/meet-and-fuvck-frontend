"use client";

import {
  EDUCATION_LEVELS,
  OCCUPATIONS,
  GENDERS,
  ORIENTATIONS,
  CURRENT_WANTS,
  INTENTS,
  BODY_TYPES,
  HEIGHTS,
  SKIN_TONES,
  BUST_SIZES,
  labelOf,
} from "@/lib/profileOptions";
import {
  IconLocation,
  IconCalendar,
  IconCap,
  IconBriefcase,
  IconSparkle,
  IconTag,
  IconUser,
  IconEye,
} from "./Icons";
import VerifiedBadge from "@/components/landing/VerifiedBadge";
import TierRibbon from "@/components/landing/TierRibbon";
import { BoostTier, isGoldTier } from "@/lib/boostTiers";
import { capitalize } from "@/lib/capitalize";
import { TbGenderGenderqueer } from "react-icons/tb";
import type { BookingRate } from "@/lib/bookingRates";
import { BOOKING_DURATIONS } from "@/lib/bookingRates";

export function BookingRatesSection({ bookingRates }: { bookingRates?: BookingRate[] }) {
  if (!bookingRates?.length) return null;
  return <section className='mx-4 mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
    <h2 className='text-base font-bold text-slate-900'>Booking rates</h2>
    <p className='mt-1 text-xs text-slate-500'>Available services and starting rates in Nigerian Naira.</p>
    <div className='mt-4 divide-y divide-slate-100'>{bookingRates.map((rate) => { const duration = BOOKING_DURATIONS.find((item) => item.id === rate.duration); const prefix = rate.duration === "travel_trips" ? "Starting from " : ""; return <div key={rate.duration} className='py-3 first:pt-0 last:pb-0'><div className='font-semibold text-slate-800'>{duration?.label ?? rate.duration}</div><div className='mt-2 flex flex-wrap gap-2 text-xs'>{rate.incall != null && <span className='rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-800'>Incall · {prefix}₦{Number(rate.incall).toLocaleString()}</span>}{rate.outcall != null && <span className='rounded-full bg-violet-50 px-3 py-1.5 font-medium text-violet-800'>Outcall · {prefix}₦{Number(rate.outcall).toLocaleString()}</span>}</div></div>;})}</div>
  </section>;
}

function formatViewCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}m`;
}

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

/* ---------- Identity header — username (not name), age, location, verified, tier ---------- */

export function IdentityHeader({
  username,
  age,
  location,
  isVerified,
  boostTier,
  reportAction,
  profileViews,
}: {
  username: string;
  age?: number;
  location?: string;
  isVerified?: boolean;
  boostTier: BoostTier;
  reportAction?: React.ReactNode;
  profileViews?: number;
}) {
  return (
    <div className='px-4 mt-4 mb-1'>
      {/* Row 1: username with action on the same line */}
      <div className='flex items-start justify-between gap-3 flex-nowrap'>
        <div className='flex items-center gap-2 flex-wrap min-w-0'>
          <h1
            className='text-[22px] font-bold text-[#0F172A] leading-tight'
            style={{ fontFamily: "var(--font-display)" }}>
            {capitalize(username)}
          </h1>
          {age && (
            <span className='text-[#64748B] font-medium text-base'>{age}</span>
          )}
          {isVerified && (
            <VerifiedBadge golden={isGoldTier(boostTier)} className='w-4 h-4' />
          )}
          {boostTier !== "regular" && <TierRibbon tier={boostTier} />}
        </div>
        {reportAction && <div className='shrink-0'>{reportAction}</div>}
      </div>

      {/* Row 2: @handle */}
      {/* <p className='text-sm text-[#94A3B8] mt-0.5'>@{username}</p> */}

      {/* Row 3: location + view count */}
      {(location || typeof profileViews === "number") && (
        <div className='flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-[#64748B]'>
          {location && (
            <div className='flex items-center gap-1'>
              <IconLocation className='w-3.5 h-3.5' />
              <span className='text-xs font-medium'>{location}</span>
            </div>
          )}
          {typeof profileViews === "number" && (
            <div className='flex items-center gap-1 text-[#1043d0]'>
              <IconEye className='w-3.5 h-3.5' />
              <span className='text-xs font-medium'>
                {formatViewCount(profileViews)}{" "}
                {profileViews === 1 ? "view" : "views"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Vibe spotlight — "right now" status ---------- */

export function VibeSpotlight({ currentWant }: { currentWant?: string }) {
  if (!currentWant || !WANT_LABELS[currentWant]) return null;
  return (
    <div className='px-4 mt-3'>
      <div className='rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#60A5FA] p-4 flex items-center gap-3 shadow-lg shadow-blue-500/20'>
        <div className='w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0'>
          <IconSparkle className='w-4 h-4 text-white' />
        </div>
        <div>
          <p className='text-[10px] font-semibold text-white/70 uppercase tracking-wide'>
            Right now
          </p>
          <p className='text-sm font-bold text-white'>
            {WANT_LABELS[currentWant]}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Bio ---------- */

export function BioQuote({ bio }: { bio?: string }) {
  if (!bio) return null;
  return (
    <div className='px-4 mt-3'>
      <div className='rounded-2xl bg-white border border-[#E2E8F0] p-5'>
        <span
          className='block text-[40px] leading-none text-[#BFDBFE] -mb-2 select-none'
          style={{ fontFamily: "Georgia, serif" }}>
          &ldquo;
        </span>
        <p
          className='text-[15px] text-[#1E293B] leading-relaxed'
          style={{ fontFamily: "var(--font-display)" }}>
          {bio}
        </p>
      </div>
    </div>
  );
}

/* ---------- Basics ---------- */

export function BasicsSection({
  age,
  location,
  gender,
  orientation,
}: {
  age?: number;
  location?: string;
  gender?: string;
  orientation?: string;
}) {
  const rows = [
    {
      icon: <IconCalendar className='w-4 h-4' />,
      label: "Age",
      value: age ? `${age} years` : null,
    },
    {
      icon: <IconLocation className='w-4 h-4' />,
      label: "Location",
      value: location || null,
    },
    {
      icon: <IconUser className='w-4 h-4' />,
      label: "Gender",
      value: labelOf(GENDERS, gender),
    },
    {
      icon: <TbGenderGenderqueer className='w-4 h-4' />,
      label: "Orientation",
      value: labelOf(ORIENTATIONS, orientation),
    },
  ].filter((r) => r.value);

  if (rows.length === 0) return null;

  return (
    <div className='px-4 mt-3'>
      <p className='text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2 px-1'>
        Basics
      </p>
      <div className='rounded-2xl bg-white border border-[#E2E8F0] divide-y divide-[#F1F5F9]'>
        {rows.map((r) => (
          <div key={r.label} className='flex items-center gap-3 px-4 py-3.5'>
            <div className='w-8 h-8 rounded-xl bg-[#F8FAFF] flex items-center justify-center text-[#1E3A8A] shrink-0'>
              {r.icon}
            </div>
            <span className='text-xs text-[#94A3B8] w-24 shrink-0'>
              {r.label}
            </span>
            <span className='text-sm font-semibold text-[#0F172A]'>
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Education & work ---------- */

export function EducationWorkSection({
  education,
  occupation,
}: {
  education?: string;
  occupation?: string;
}) {
  const eduLabel = labelOf(EDUCATION_LEVELS, education);
  const jobLabel = labelOf(OCCUPATIONS, occupation);
  if (!eduLabel && !jobLabel) return null;

  return (
    <div className='px-4 mt-3'>
      <p className='text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2 px-1'>
        Education &amp; work
      </p>
      <div className='grid grid-cols-2 gap-2.5'>
        {eduLabel && (
          <div className='rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] p-4'>
            <div className='w-8 h-8 rounded-xl bg-white flex items-center justify-center text-amber-600 mb-2.5'>
              <IconCap className='w-4 h-4' />
            </div>
            <p className='text-[10px] text-amber-700/70 font-medium mb-0.5'>
              Education
            </p>
            <p className='text-sm font-bold text-[#7C2D12] leading-snug'>
              {eduLabel}
            </p>
          </div>
        )}
        {jobLabel && (
          <div className='rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] p-4'>
            <div className='w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#4338CA] mb-2.5'>
              <IconBriefcase className='w-4 h-4' />
            </div>
            <p className='text-[10px] text-[#4338CA]/70 font-medium mb-0.5'>
              Occupation
            </p>
            <p className='text-sm font-bold text-[#312E81] leading-snug'>
              {jobLabel}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Appearance — body type + skin tone in one card, bust size gets its own card ---------- */

export function AppearanceSection({
  bodyType,
  height,
  skinTone,
  bustSize,
}: {
  bodyType?: string[];
  height?: string;
  skinTone?: string;
  bustSize?: string;
}) {
  const bodyChips = [
    ...(bodyType || []).map((b) => labelOf(BODY_TYPES, b)),
    height ? labelOf(HEIGHTS, height) : undefined,
    labelOf(SKIN_TONES, skinTone),
  ].filter(Boolean) as string[];

  const bustLabel = labelOf(BUST_SIZES, bustSize);

  if (bodyChips.length === 0 && !bustLabel) return null;

  return (
    <div className='px-4 mt-3'>
      <p className='text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2 px-1'>
        Appearance
      </p>

      {/* Body type + skin tone */}
      {bodyChips.length > 0 && (
        <div className='rounded-2xl bg-white border border-[#E2E8F0] p-4 flex flex-wrap gap-2 mb-2.5'>
          {bodyChips.map((c) => (
            <span
              key={c}
              className='text-xs font-semibold text-[#9D174D] bg-[#FDF2F8] border border-[#FBCFE8] px-3 py-1.5 rounded-full'>
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Bust size — own demarcated card */}
      {bustLabel && (
        <div className='rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] p-4 flex items-center gap-3'>
          <div className='w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0'>
            {/* Simple silhouette icon */}
            <svg
              className='w-4 h-4 text-[#BE123C]'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth={1.7}>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 3C9 3 6.5 5 6 8c-.3 1.5 0 3 .5 4H17.5c.5-1 .8-2.5.5-4C17.5 5 15 3 12 3z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M6.5 12c-1 2-1 4 0 6h11c1-2 1-4 0-6'
              />
            </svg>
          </div>
          <div>
            <p className='text-[10px] font-semibold text-[#BE123C]/70 uppercase tracking-wide'>
              Bust size
            </p>
            <p className='text-sm font-bold text-[#881337]'>{bustLabel}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Looking for — shown BEFORE right now / vibe spotlight ---------- */

export function LookingForSection({ intent }: { intent?: string[] }) {
  const labels = (intent || [])
    .map((i) => labelOf(INTENTS, i))
    .filter(Boolean) as string[];
  if (labels.length === 0) return null;

  return (
    <div className='px-4 mt-3'>
      <p className='text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2 px-1'>
        Looking for
      </p>
      <div className='flex flex-wrap gap-2'>
        {labels.map((l) => (
          <span
            key={l}
            className='text-xs font-semibold text-white bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] px-3.5 py-2 rounded-xl'>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Experiences ---------- */

export function ExperiencesSection({
  experiences,
}: {
  experiences?: string[];
}) {
  if (!experiences || experiences.length === 0) return null;
  return (
    <div className='px-4 mt-3 mb-6'>
      <p className='text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide mb-2 px-1'>
        Experiences
      </p>
      <div className='rounded-2xl bg-[#F8FAFF] border border-[#E2E8F0] p-4 flex flex-wrap gap-2'>
        {experiences.map((e) => (
          <span
            key={e}
            className='flex items-center gap-1.5 text-xs font-medium text-[#1E3A8A] bg-white border border-[#DBEAFE] px-3 py-1.5 rounded-full'>
            <IconTag className='w-3 h-3' />
            {e.replace(/_/g, " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
