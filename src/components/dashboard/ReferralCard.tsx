"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getCachedData, setCachedData } from "@/lib/apiCache";

// ── Icons (stroke-based, matches onboarding icon style — no emoji) ──────────
function Icon({
  name,
  className = "w-5 h-5",
}: {
  name: string;
  className?: string;
}) {
  const icons: Record<string, React.ReactElement> = {
    gift: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M20 12v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z'
        />
      </svg>
    ),
    copy: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
        />
      </svg>
    ),
    check: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={2.5}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
      </svg>
    ),
    share: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M8.684 13.342a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
        />
      </svg>
    ),
    coin: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <circle cx='12' cy='12' r='9' />
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.25-2.5 1.5-2.5.5-2.5 1.5 1 1.5 2.5 1.5 2.5-.5 2.5-1.5M12 7v1m0 8v1'
        />
      </svg>
    ),
    rocket: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'></path>
      </svg>
    ),
    users: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
        />
      </svg>
    ),
  };
  return icons[name] ?? <span className={className} />;
}

interface ReferralStats {
  referralCode: string;
  activationCoins: number;
  boostCoins: number;
  totalCoins: number;
  successfulReferrals: number;
}

const REFERRAL_CACHE_KEY = "dashboard:referral-card";

// Shimmering placeholder for a single value once real data is known — the
// card chrome around it (gradient, header, buttons) never shimmers, only
// the numbers/code that actually come from the API.
function ValueSkeleton({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block align-middle rounded-full bg-white/20 animate-pulse ${className}`}
    />
  );
}

export default function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(() =>
    getCachedData<ReferralStats>(REFERRAL_CACHE_KEY),
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Only the values inside the card are ever in a "loading" state — the
  // card itself always renders in full immediately.
  const hasStats = Boolean(stats);

  useEffect(() => {
    let cancelled = false;
    api.referrals
      .mine()
      .then((data) => {
        if (cancelled) return;
        setStats(data);
        setCachedData(REFERRAL_CACHE_KEY, data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function shareLink(code: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/register?ref=${code}`;
  }

  async function copy(text: string, which: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "code") {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1800);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1800);
      }
    } catch {}
  }

  return (
    <div className='relative overflow-hidden rounded-2xl mb-3 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] p-5 shadow-lg shadow-[#1E3A8A]/15'>
      <div className='absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5' />

      <div className='relative flex items-center gap-2 mb-4'>
        <div className='w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0'>
          <Icon name='gift' className='w-4.5 h-4.5 text-white' />
        </div>
        <div>
          <p className='text-sm font-bold text-white'>Invite & Earn</p>
          <p className='text-[11px] text-white/70'>
            Share your code, earn coins when they activate or boost
          </p>
        </div>
      </div>

      {/* Code + copy */}
      <div className='relative flex items-center gap-2 mb-3'>
        <div className='flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 flex items-center justify-between'>
          {hasStats ? (
            <span className='text-white font-mono font-semibold text-sm tracking-wide'>
              {stats!.referralCode}
            </span>
          ) : (
            <ValueSkeleton className='h-4 w-24' />
          )}
        </div>
        <button
          onClick={() => hasStats && copy(stats!.referralCode, "code")}
          disabled={!hasStats}
          className='shrink-0 w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center hover:bg-white/20 transition disabled:opacity-50 disabled:hover:bg-white/15'
          aria-label='Copy referral code'>
          <Icon
            name={copiedCode ? "check" : "copy"}
            className='w-4 h-4 text-white'
          />
        </button>
      </div>

      {/* Share link */}
      <button
        onClick={() => hasStats && copy(shareLink(stats!.referralCode), "link")}
        disabled={!hasStats}
        className='relative w-full flex items-center justify-center gap-2 bg-white text-[#1E3A8A] font-semibold text-xs rounded-xl py-2.5 mb-4 hover:bg-white/90 transition disabled:opacity-60 disabled:hover:bg-white'>
        <Icon name={copiedLink ? "check" : "share"} className='w-3.5 h-3.5' />
        {copiedLink ? "Link copied" : "Copy share link"}
      </button>

      {/* Stats */}
      <div className='relative grid grid-cols-3 gap-2'>
        <StatBlock
          iconName='users'
          label='Invites'
          value={stats?.successfulReferrals}
        />
        <StatBlock
          iconName='rocket'
          label='Activation'
          value={stats?.activationCoins}
          suffix=' coins'
        />
        <StatBlock
          iconName='coin'
          label='Boost'
          value={stats?.boostCoins}
          suffix=' coins'
        />
      </div>
    </div>
  );
}

function StatBlock({
  iconName,
  label,
  value,
  suffix = "",
}: {
  iconName: string;
  label: string;
  value?: number;
  suffix?: string;
}) {
  return (
    <div className='bg-white/10 border border-white/15 rounded-xl px-2.5 py-2.5 text-center'>
      <div className='flex justify-center mb-1'>
        <Icon name={iconName} className='w-3.5 h-3.5 text-white/80' />
      </div>
      <p className='text-white font-bold text-sm leading-tight min-h-[1.1em]'>
        {value === undefined ? (
          <ValueSkeleton className='h-3.5 w-6' />
        ) : (
          <>
            {value}
            <span className='text-[10px] font-medium text-white/70'>
              {suffix}
            </span>
          </>
        )}
      </p>
      <p className='text-[10px] text-white/60'>{label}</p>
    </div>
  );
}
