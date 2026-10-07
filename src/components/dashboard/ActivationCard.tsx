"use client";

import { useEffect, useState } from "react";
import { TIER_META, BoostTier } from "@/lib/boostTiers";
import TierChip from "@/components/TierBadge";
import BoostModal from "./BoostModal";
import { Coins } from "lucide-react";
import { friendlyApiMessage } from "@/lib/apiMessages";
import { DEFAULT_PRICING, fetchPricingConfig } from "@/lib/pricing";
import { activateAccount } from "@/lib/activation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ActivationCardProps {
  activationStatus?: "none" | "pending" | "activated";
  isActivated?: boolean;
  boostTier?: BoostTier;
  boostStatus?: "none" | "pending";
  onActivated: () => void;
  onTopUpClick?: (coins?: number) => void;
}

export default function ActivationCard({
  activationStatus = "none",
  isActivated,
  boostTier = "regular",
  boostStatus = "none",
  onActivated,
  onTopUpClick,
}: ActivationCardProps) {
  const [boostOpen, setBoostOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [activationCoins, setActivationCoins] = useState(
    DEFAULT_PRICING.activationCoins,
  );
  const [activationFeeEnabled, setActivationFeeEnabled] = useState(
    DEFAULT_PRICING.activationFeeEnabled,
  );

  useEffect(() => {
    void (async () => {
      const pricing = await fetchPricingConfig();
      setActivationCoins(pricing.activationCoins);
      setActivationFeeEnabled(pricing.activationFeeEnabled);
    })();
  }, []);

  const insufficientCoins =
    /insufficient|not enough coin|not enough balance|low balance|top[\s-]?up|activation requires/i.test(
      error,
    );

  async function handleActivate() {
    setError("");
    setPaying(true);
    try {
      const { res, data } = await activateAccount();
      if (!res.ok) {
        setError(
          friendlyApiMessage(
            data.message,
            "We couldn't activate the account right now.",
          ),
        );
        return;
      }
      onActivated();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  if (isActivated || activationStatus === "activated") {
    const meta = TIER_META[boostTier];
    return (
      <>
        <div className='relative mb-3 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 shadow-lg shadow-emerald-500/20'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20'>
              <svg
                className='h-5 w-5 text-white'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={2}>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <div className='flex-1'>
              <p className='text-sm font-bold text-white'>Account Activated</p>
              <p className='text-xs text-white/80'>
                Plan:{" "}
                {boostTier === "regular" ? (
                  <span className='font-semibold'>{meta.label}</span>
                ) : (
                  <TierChip
                    tier={boostTier}
                    size='sm'
                    variant='overlay'
                    className='ml-1 align-middle'
                  />
                )}
                {boostStatus === "pending" && (
                  <span className='ml-1.5 text-amber-200'>
                    · upgrade pending
                  </span>
                )}
              </p>
            </div>
          </div>
          {boostTier !== "elite_plus" && (
            <button
              onClick={() => setBoostOpen(true)}
              className='mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/25 bg-white/15 py-2.5 text-xs font-semibold text-white'>
              🚀 Boost account
            </button>
          )}
        </div>
        {boostOpen && (
          <BoostModal
            currentTier={boostTier}
            onClose={() => setBoostOpen(false)}
            onSubmitted={() => {
              setBoostOpen(false);
              onActivated();
            }}
            onTopUpClick={onTopUpClick}
          />
        )}
      </>
    );
  }

  return (
    <div className='relative mb-3 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#2747a8] to-[#3B82F6] p-5 shadow-lg shadow-[#1E3A8A]/25'>
      <div className='absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10' />
      <div className='relative'>
        <div className='mb-2 flex items-center gap-2'>
          <span className='text-xl'>🪙</span>
          <p className='text-xs font-semibold uppercase tracking-widest text-white/70'>
            Final step
          </p>
        </div>
        <p className='mb-1 text-lg font-bold text-white'>
          Activate your account
        </p>
        <p className='mb-1 text-sm leading-relaxed text-white/80'>
          {activationFeeEnabled ? (
            <>
              Spend{" "}
              <span className='font-bold text-white'>
                {activationCoins} coins
              </span>{" "}
              to make your profile visible to seekers.
            </>
          ) : (
            <>Activate now for free to make your profile visible to seekers.</>
          )}
        </p>
        <p className='mb-4 text-xs text-white/60'>
          {activationFeeEnabled
            ? "Deducted instantly from your wallet."
            : "No coins will be deducted."}
        </p>

        {error && (
          <div className='mb-3 rounded-2xl border border-rose-200 bg-[#FFF7F8] px-3 py-3 shadow-sm shadow-black/5'>
            <p className='text-xs font-medium leading-relaxed text-[#9F1239]'>
              {error}
            </p>
            {insufficientCoins && onTopUpClick && (
              <button
                type='button'
                onClick={() => onTopUpClick()}
                className='mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#1e40af]'>
                Top up wallet
                <span aria-hidden='true'>→</span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={handleActivate}
          disabled={paying}
          className='flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1E3A8A] transition disabled:opacity-60'>
          {paying ? (
            <>
              <span className='h-4 w-4 animate-spin rounded-full border-2 border-[#1E3A8A]/30 border-t-[#1E3A8A]' />
              Activating…
            </>
          ) : (
            <>
              <Coins className='h-5 w-5' />
              {activationFeeEnabled
                ? `Activate for ${activationCoins} coins`
                : "Activate for free"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
