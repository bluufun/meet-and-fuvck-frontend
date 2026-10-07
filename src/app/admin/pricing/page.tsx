"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { canAdminAccess } from "@/lib/adminAccess";
import { getAdminRedirect, shouldFetchAdminData } from "@/lib/adminGuards";
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing";
import { friendlyApiMessage } from "@/lib/apiMessages";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function formatNgn(amount: number, rate: number) {
  return `₦${Math.round(amount * rate).toLocaleString()}`;
}

export default function AdminPricingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const canManage = canAdminAccess(user?.adminPermissions, "manage_users", user?.adminRole || null);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const redirect = getAdminRedirect("/admin/pricing", loading, user);
    if (redirect) {
      router.replace(redirect);
      return;
    }
    if (!shouldFetchAdminData(loading, user, canManage)) return;

    void (async () => {
      try {
        const res = await fetch(`${API}/api/admin/pricing`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("bf_token")}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("pricing");
        const data = await res.json();
        if (data?.pricing) setPricing(data.pricing);
      } catch {
        setError("We couldn't load pricing right now.");
      }
    })();
  }, [canManage, loading, router, user]);

  async function handleSave() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API}/api/admin/pricing`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
        },
        body: JSON.stringify(pricing),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(friendlyApiMessage(data.message, "We couldn't update pricing."));
        return;
      }
      setPricing(data.pricing);
      setMessage("Pricing updated successfully.");
    } catch {
      setError("We couldn't update pricing.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center">
        <div className="max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">Access restricted</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Your admin account cannot manage pricing.</p>
          <button onClick={() => router.push("/admin")} className="mt-5 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
            Back to admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Pricing control</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Boost and activation pricing</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Adjust live coin costs for activation and boost tiers. These changes apply to new purchases immediately.
            </p>
          </div>

          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Activation fee</span>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPricing((prev) => ({ ...prev, activationFeeEnabled: true }))}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    pricing.activationFeeEnabled
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  On
                </button>
                <button
                  type="button"
                  onClick={() => setPricing((prev) => ({ ...prev, activationFeeEnabled: false }))}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    !pricing.activationFeeEnabled
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  Off
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                When off, funmates can activate their account for free. When on, activation uses the coin amount below.
              </p>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Activation coins</span>
              <input
                type="number"
                min="0"
                value={pricing.activationCoins}
                onChange={(e) => setPricing((prev) => ({ ...prev, activationCoins: Number(e.target.value) }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-2 text-xs font-semibold text-emerald-600">{formatNgn(pricing.activationCoins, pricing.coinRateNgn)}</p>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Coin rate (NGN)</span>
              <input
                type="number"
                min="1"
                value={pricing.coinRateNgn}
                onChange={(e) => setPricing((prev) => ({ ...prev, coinRateNgn: Number(e.target.value) }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-2 text-xs font-semibold text-emerald-600">Used to convert every coin price into naira.</p>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Contact unlock coins</span>
              <input
                type="number"
                min="0"
                value={pricing.unlockCoins}
                onChange={(e) => setPricing((prev) => ({ ...prev, unlockCoins: Number(e.target.value) }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-2 text-xs font-semibold text-emerald-600">{formatNgn(pricing.unlockCoins, pricing.coinRateNgn)}</p>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Referrer commission on activation</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={pricing.referralActivationPercent}
                onChange={(e) => setPricing((prev) => ({ ...prev, referralActivationPercent: Number(e.target.value) }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-2 text-xs text-slate-500">Use a decimal value. Example: 0.5 = 50%.</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                {formatNgn(pricing.activationCoins * pricing.referralActivationPercent, pricing.coinRateNgn)} per activation
              </p>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Referrer commission on boost</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={pricing.referralBoostPercent}
                onChange={(e) => setPricing((prev) => ({ ...prev, referralBoostPercent: Number(e.target.value) }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-2 text-xs text-slate-500">Use a decimal value. Example: 0.2 = 20%.</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                {formatNgn(pricing.boostPlans.elite * pricing.referralBoostPercent, pricing.coinRateNgn)} on Elite boost,
                with plan-specific amounts scaling by the selected tier.
              </p>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Fresher boost</span>
              <input
                type="number"
                min="0"
                value={pricing.boostPlans.fresher}
                onChange={(e) => setPricing((prev) => ({ ...prev, boostPlans: { ...prev.boostPlans, fresher: Number(e.target.value) } }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-2 text-xs font-semibold text-emerald-600">{formatNgn(pricing.boostPlans.fresher, pricing.coinRateNgn)}</p>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Elite boost</span>
              <input
                type="number"
                min="0"
                value={pricing.boostPlans.elite}
                onChange={(e) => setPricing((prev) => ({ ...prev, boostPlans: { ...prev.boostPlans, elite: Number(e.target.value) } }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-2 text-xs font-semibold text-emerald-600">{formatNgn(pricing.boostPlans.elite, pricing.coinRateNgn)}</p>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-white p-4 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Elite Plus boost</span>
              <input
                type="number"
                min="0"
                value={pricing.boostPlans.elite_plus}
                onChange={(e) => setPricing((prev) => ({ ...prev, boostPlans: { ...prev.boostPlans, elite_plus: Number(e.target.value) } }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              />
              <p className="mt-2 text-xs font-semibold text-emerald-600">{formatNgn(pricing.boostPlans.elite_plus, pricing.coinRateNgn)}</p>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setPricing(DEFAULT_PRICING)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Reset defaults
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save pricing"}
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Back to admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
