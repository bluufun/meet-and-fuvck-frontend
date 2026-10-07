"use client";

import { useEffect, useState } from "react";
import { BoostTier, TIER_META, MEDIA_QUOTA_BY_TIER } from "@/lib/boostTiers";
import TierChip, { TierBadge } from "@/components/TierBadge";
import { Coins } from "lucide-react";
import { friendlyApiMessage } from "@/lib/apiMessages";
import { DEFAULT_PRICING, fetchPricingConfig } from "@/lib/pricing";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface BoostModalProps {
  currentTier: BoostTier;
  onClose: () => void;
  onSubmitted: () => void;
  onTopUpClick?: (coins?: number) => void;
}

const PLAN_ORDER: BoostTier[] = ["elite_plus", "elite", "fresher", "regular"];

export default function BoostModal({
  currentTier,
  onClose,
  onSubmitted,
  onTopUpClick,
}: BoostModalProps) {
  const [selected, setSelected] = useState<BoostTier | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);

  useEffect(() => {
    void (async () => setPricing(await fetchPricingConfig()))();
  }, []);

  const insufficientCoins =
    /insufficient|not enough coin|not enough balance|low balance|wallet/i.test(
      error,
    );

  async function handlePay() {
    if (!selected) return;
    setError("");
    setPaying(true);
    try {
      const res = await fetch(`${API}/api/boost/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
        },
        body: JSON.stringify({ tier: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          friendlyApiMessage(
            data.message,
            "We couldn't activate that boost right now.",
          ),
        );
        return;
      }
      setDone(true);
      setTimeout(() => onSubmitted(), 1400);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  const planCoins = (tier: BoostTier) => {
    if (tier === "fresher") return pricing.boostPlans.fresher;
    if (tier === "elite") return pricing.boostPlans.elite;
    if (tier === "elite_plus") return pricing.boostPlans.elite_plus;
    return 0;
  };

  const renderPerks = (tier: BoostTier) => {
    const quota = MEDIA_QUOTA_BY_TIER[tier];
    const base = TIER_META[tier];
    const perksByTier: Record<BoostTier, string[]> = {
      regular: [
        "Standard visibility",
        `Up to ${quota.photos} photos + ${quota.videos} videos`,
        "Your current level",
      ],
      fresher: [
        "Boosted visibility over Regular",
        "Fresher badge",
        `Up to ${quota.photos} photos + ${quota.videos} videos`,
      ],
      elite: [
        "High visibility",
        "Priority placement in search",
        "Golden verified badge",
        "Elite badge",
        `Up to ${quota.photos} photos + ${quota.videos} videos`,
      ],
      elite_plus: [
        "Top visibility above everyone",
        "Highest priority in search",
        "Golden verified badge",
        "Elite Plus badge",
        `Up to ${quota.photos} photos + ${quota.videos} videos`,
      ],
    };
    return {
      label: base.label,
      perks: perksByTier[tier],
      coins: planCoins(tier),
    };
  };

  return (
    <div
      className='fixed inset-0 z-[65] flex items-center justify-center px-4'
      style={{ background: "rgba(15,23,42,0.6)" }}>
      <div className='flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl'>
        {done ? (
          <div className='p-8 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-3xl'>
              🚀
            </div>
            <h3 className='mb-1 text-lg font-bold text-[#0F172A]'>
              Boost activated!
            </h3>
            <p className='text-sm text-[#64748B]'>
              Your account has been upgraded. Active for 7 days.
            </p>
          </div>
        ) : selected ? (
          <>
            <div
              className={`relative shrink-0 bg-gradient-to-br ${TIER_META[selected].gradient} px-6 py-7 text-white`}>
              <button
                onClick={() => {
                  setSelected(null);
                  setError("");
                }}
                className='absolute left-4 top-4 text-white/80 hover:text-white'>
                <svg
                  className='h-5 w-5'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2}>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M15 19l-7-7 7-7'
                  />
                </svg>
              </button>
              <button
                onClick={onClose}
                className='absolute right-4 top-4 text-xl text-white/80 hover:text-white'>
                ✕
              </button>
              <p className='mb-1 text-xs font-semibold uppercase tracking-widest text-white/70'>
                {TIER_META[selected].label} Boost
              </p>
              <p className='text-3xl font-black'>
                <span className='flex items-center gap-1'>
                  <Coins className='h-5.5 w-5.5' />
                  {planCoins(selected)} coins
                </span>
              </p>
              <p className='mt-1 text-sm text-white/80'>
                ≈ ₦
                {(planCoins(selected) * pricing.coinRateNgn).toLocaleString()} ·
                Active for 7 days
              </p>
              {selected !== "regular" && (
                <TierBadge
                  tier={selected}
                  size={54}
                  className='absolute bottom-5 right-6'
                />
              )}
            </div>

            <div className='p-6'>
              {error && (
                <div className='mb-3 rounded-xl bg-red-50 px-3 py-2'>
                  <p className='text-xs text-red-500'>{error}</p>
                  {insufficientCoins && onTopUpClick && (
                    <button
                      type='button'
                      onClick={() => {
                        onClose();
                        onTopUpClick(planCoins(selected));
                      }}
                      className='mt-2 inline-flex items-center rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#1e40af]'>
                      Top up coins
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={paying}
                className='flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] py-3.5 text-sm font-semibold text-white disabled:opacity-50'>
                {paying ? (
                  <>
                    <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                    Processing…
                  </>
                ) : (
                  <>
                    <Coins className='h-3.5 w-3.5' /> Pay {planCoins(selected)}{" "}
                    coins — Activate {TIER_META[selected].label}
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className='shrink-0 border-b border-[#F1F5F9] px-5 py-4'>
              <div>
                <h2 className='text-base font-bold text-[#0F172A]'>
                  Boost your account
                </h2>
                <p className='mt-0.5 text-xs text-[#94A3B8]'>
                  Coins deducted instantly · 7 days active
                </p>
              </div>
              <button
                onClick={onClose}
                className='absolute right-5 top-4 text-[#94A3B8] text-xl'>
                ✕
              </button>
            </div>
            <div className='space-y-3 overflow-y-auto p-5'>
              {PLAN_ORDER.map((tier) => {
                const data = renderPerks(tier);
                const isCurrent = tier === currentTier;
                const isFree = tier === "regular";
                return (
                  <div
                    key={tier}
                    className={`rounded-2xl border-2 p-4 ${isCurrent ? "border-[#1E3A8A] bg-[#EFF6FF]" : "border-[#E2E8F0]"}`}>
                    <div className='mb-2 flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        {tier === "regular" ? (
                          <span
                            className={`rounded-full bg-gradient-to-br px-2.5 py-1 text-xs font-bold ${TIER_META[tier].gradient} ${TIER_META[tier].textColor}`}>
                            {data.label}
                          </span>
                        ) : (
                          <TierChip tier={tier} size='lg' variant='light' />
                        )}
                        {isCurrent && (
                          <span className='text-[10px] font-semibold text-[#1E3A8A]'>
                            Current plan
                          </span>
                        )}
                      </div>
                      <span className='text-sm font-bold text-[#0F172A]'>
                        {isFree ? "Free" : `${data.coins} coins`}
                      </span>
                    </div>
                    <ul className='mb-3 space-y-1'>
                      {data.perks.map((p) => (
                        <li
                          key={p}
                          className='flex items-start gap-1.5 text-xs text-[#64748B]'>
                          <span className='mt-0.5 text-emerald-500'>✓</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && !isFree && (
                      <button
                        onClick={() => {
                          setSelected(tier);
                          setError("");
                        }}
                        className='w-full rounded-xl bg-[#0F172A] py-2.5 text-xs font-semibold text-white'>
                        Select {data.label} ·{" "}
                        <Coins className='inline-block h-3.5 w-3.5' />{" "}
                        {data.coins} coins
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
