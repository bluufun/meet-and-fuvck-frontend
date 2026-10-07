"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaCoins, FaLock } from "react-icons/fa6";
import { friendlyApiMessage } from "@/lib/apiMessages";
import { DEFAULT_PRICING, fetchPricingConfig } from "@/lib/pricing";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface UnlockContactModalProps {
  username: string;
  priceNgn?: number;
  onClose: () => void;
  onUnlocked: (whatsapp: string) => void;
}

export default function UnlockContactModal({
  username,
  priceNgn,
  onClose,
  onUnlocked,
}: UnlockContactModalProps) {
  const [step, setStep] = useState<"confirm" | "loading" | "done" | "error" | "auth">("confirm");
  const [errMsg, setErrMsg] = useState("");
  const [coinRateNgn, setCoinRateNgn] = useState(DEFAULT_PRICING.coinRateNgn);
  const unlockPriceNgn = Math.max(0, priceNgn || 0);
  const unlockPriceCoins = Math.max(1, Math.ceil(unlockPriceNgn / Math.max(1, coinRateNgn)));

  useEffect(() => {
    void (async () => {
      const pricing = await fetchPricingConfig();
      setCoinRateNgn(pricing.coinRateNgn || DEFAULT_PRICING.coinRateNgn);
    })();
  }, []);

  function isAuthError(status: number, message?: string) {
    const normalized = (message || "").toLowerCase();
    return (
      status === 401 ||
      status === 403 ||
      normalized.includes("not authorized") ||
      normalized.includes("token invalid") ||
      normalized.includes("unauthoriz")
    );
  }

  async function handleUnlock() {
    setStep("loading");
    try {
      const res = await fetch(`${API}/api/contact/${username}/unlock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        if (isAuthError(res.status, data.message)) {
          setStep("auth");
          return;
        }

        setErrMsg(
          friendlyApiMessage(
            data.message,
            "We couldn't unlock this contact right now.",
          ),
        );
        setStep("error");
        return;
      }

      setStep("done");
      setTimeout(() => onUnlocked(data.whatsapp || ""), 1200);
    } catch {
      setErrMsg("Something went wrong. Please try again.");
      setStep("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ background: "rgba(15,23,42,0.6)" }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        {step === "done" && (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-700">
              OK
            </div>
            <p className="mb-1 text-lg font-bold text-[#0F172A]">Contact unlocked!</p>
            <p className="text-sm text-[#64748B]">WhatsApp number is now visible below.</p>
          </div>
        )}

        {step === "loading" && (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#BFDBFE] border-t-[#1E3A8A]" />
            <p className="text-sm font-semibold text-[#0F172A]">Unlocking contact...</p>
          </div>
        )}

        {step === "error" && (
          <div className="p-6">
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="mb-1 text-sm font-semibold text-red-700">Couldn't unlock contact</p>
              <p className="text-xs text-red-500">{errMsg}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#E2E8F0] py-3 text-sm font-semibold text-[#64748B]"
              >
                Close
              </button>
              <button
                onClick={() => setStep("confirm")}
                className="flex-1 rounded-xl bg-[#1E3A8A] py-3 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {step === "auth" && (
          <div className="p-6">
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="mb-1 text-sm font-semibold text-amber-800">Login required</p>
              <p className="text-xs text-amber-700">
                Please sign in first, then come back to unlock this contact.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-[#E2E8F0] py-3 text-sm font-semibold text-[#64748B]"
              >
                Not now
              </button>
              <Link
                href="/login"
                className="flex flex-1 items-center justify-center rounded-xl bg-[#1E3A8A] py-3 text-sm font-semibold text-white"
              >
                Go to login
              </Link>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
                <FaLock />
              </div>
              <h3 className="mb-0.5 text-lg font-bold">Unlock WhatsApp</h3>
              <p className="text-sm text-white/80">@{username}&apos;s contact</p>
            </div>

            <div className="p-5">
              <div className="mb-4 space-y-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFF] p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Cost</span>
                  <span className="font-bold text-[#0F172A]">NGN {unlockPriceNgn.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Wallet charge</span>
                  <span className="font-bold text-[#0F172A]">{unlockPriceCoins.toLocaleString()} coins</span>
                </div>
                <p className="text-[11px] leading-5 text-[#94A3B8]">
                  Based on the current rate of NGN {coinRateNgn.toLocaleString()} per coin.
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Duration</span>
                  <span className="font-semibold text-[#0F172A]">Lifetime</span>
                </div>
              </div>

              <p className="mb-4 text-center text-xs text-[#94A3B8]">
                Paid or earned coins will be deducted from your wallet instantly
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-[#E2E8F0] py-3 text-sm font-semibold text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnlock}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white"
                >
                  <span className="flex items-center justify-center gap-1">
                    <FaLock /> Unlock <FaCoins className="h-3 w-3 text-amber-300" /> {unlockPriceCoins.toLocaleString()} coins
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
