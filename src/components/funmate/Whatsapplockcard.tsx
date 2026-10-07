"use client";

import { useEffect, useState } from "react";
import { FaCoins, FaWhatsapp } from "react-icons/fa6";

import UnlockContactModal from "./Unlockcontactmodal";
import { DEFAULT_PRICING, fetchPricingConfig } from "@/lib/pricing";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface WhatsAppLockCardProps {
  username: string;
  unlocked: boolean;
  whatsapp?: string | null;
  locked?: boolean;
  priceNgn?: number;
}

function buildWhatsAppPretext(username: string) {
  const openers = [
    `Hi ${username}, what's good? I got you from Bluufun.`,
    `Hey ${username}, Bluufun sent me your way. How are you?`,
    `Hi ${username}, I found you on Bluufun and wanted to say hello.`,
    `Hello ${username}, I came across your Bluufun profile and had to reach out.`,
    `Hi ${username}, got your contact from Bluufun. Hope you're doing well.`,
  ];

  const hourBucket = new Date().getHours();
  let hash = hourBucket;
  for (let i = 0; i < username.length; i += 1) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }

  return openers[hash % openers.length];
}

function normalizeNigeriaWhatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  if (digits.startsWith("234")) return digits;
  return digits;
}

function trackWhatsAppClick(username: string) {
  // Fire-and-forget: we log click-intent, not confirmed arrival in
  // WhatsApp — there's no reliable way to detect the wa.me handoff
  // actually completed (app not installed, popup blocked, user backs
  // out), and by the time that would resolve the browser has already
  // navigated to a new tab anyway. Never awaited, never blocks the link.
  fetch(`${API}/api/funmates/${encodeURIComponent(username)}/whatsapp-click`, {
    method: "POST",
    headers: (() => {
      const token = localStorage.getItem("bf_token");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      return headers;
    })(),
  }).catch(() => {
    // Non-critical — worst case a click goes uncounted, never worth
    // interrupting the user's actual WhatsApp navigation for.
  });
}

export default function WhatsAppLockCard({
  username,
  unlocked: initialUnlocked,
  whatsapp: initialWhatsapp,
  locked: initialLocked = false,
  priceNgn: initialPriceNgn = 0,
}: WhatsAppLockCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp ?? null);
  const [locked, setLocked] = useState(initialLocked);
  const [priceNgn, setPriceNgn] = useState(initialPriceNgn);
  const [coinRateNgn, setCoinRateNgn] = useState(DEFAULT_PRICING.coinRateNgn);
  const [checking, setChecking] = useState(!initialUnlocked);
  const visibleWhatsapp = whatsapp ?? initialWhatsapp ?? null;
  const pretext = buildWhatsAppPretext(username);
  const waLink = visibleWhatsapp
    ? `https://wa.me/${normalizeNigeriaWhatsapp(visibleWhatsapp)}?text=${encodeURIComponent(pretext)}`
    : "";

  const priceCoins = Math.max(
    1,
    Math.ceil(priceNgn / Math.max(1, coinRateNgn)),
  );

  useEffect(() => {
    void (async () => {
      const pricing = await fetchPricingConfig();
      setCoinRateNgn(pricing.coinRateNgn || DEFAULT_PRICING.coinRateNgn);
    })();
  }, []);

  useEffect(() => {
    if (initialUnlocked) {
      queueMicrotask(() => setChecking(false));
      return;
    }

    const token = localStorage.getItem("bf_token");
    if (!token) {
      queueMicrotask(() => setChecking(false));
      return;
    }

    fetch(`${API}/api/contact/${username}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setLocked(Boolean(data.locked));
        setPriceNgn(Number(data.priceNgn || 0));
        if (data.unlocked || !data.locked) {
          setUnlocked(true);
          setWhatsapp(data.whatsapp ?? initialWhatsapp ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [initialUnlocked, username]);

  function handleUnlocked(wa: string) {
    setUnlocked(true);
    setWhatsapp(wa);
    setModalOpen(false);
  }

  if (checking) {
    return (
      <div className='mx-3 mt-3'>
        <div className='h-16 animate-pulse rounded-2xl bg-white p-4 shadow-md shadow-emerald-900/5' />
      </div>
    );
  }

  return (
    <div className='mx-3 mt-3'>
      <div className='flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-md shadow-emerald-900/5'>
        <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white'>
          <FaWhatsapp className='text-[22px]' />
        </div>

        <div className='min-w-0 flex-1'>
          <p className='text-[11px] font-semibold uppercase tracking-wide text-emerald-700'>
            WhatsApp
          </p>
          {(unlocked || !locked) && visibleWhatsapp ? (
            <a
              href={waLink}
              target='_blank'
              rel='noopener noreferrer'
              onClick={() => trackWhatsAppClick(username)}
              className='mt-0.5 text-sm font-bold text-[#0F172A] transition hover:text-emerald-700'>
              {visibleWhatsapp}
            </a>
          ) : (
            <div className='mt-0.5'>
              <p
                className='select-none text-sm font-semibold text-[#0F172A]/40'
                style={{ filter: "blur(4px)" }}>
                080 ... ...
              </p>
              {locked && (
                <p className='text-[11px] text-[#94A3B8]'>
                  Unlock for NGN {priceNgn.toLocaleString()} (
                  {priceCoins.toLocaleString()} coins)
                </p>
              )}
            </div>
          )}
        </div>

        {!unlocked && locked && (
          <button
            onClick={() => setModalOpen(true)}
            className='shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white'>
            <span className='flex items-center gap-1'>
              Unlock <FaCoins className='h-3 w-3 text-amber-300' />{" "}
              {priceCoins.toLocaleString()} coins
            </span>
          </button>
        )}

        {!locked && (
          <span className='shrink-0 rounded-xl bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700'>
            Visible
          </span>
        )}

        {unlocked && locked && (
          <span className='shrink-0 rounded-xl bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700'>
            Unlocked
          </span>
        )}
      </div>

      {modalOpen && (
        <UnlockContactModal
          username={username}
          priceNgn={priceNgn}
          onClose={() => setModalOpen(false)}
          onUnlocked={handleUnlocked}
        />
      )}
    </div>
  );
}
