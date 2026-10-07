"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { friendlyApiMessage } from "@/lib/apiMessages";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Password strength
  const pwStrength = (() => {
    const p = password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  })();
  const pwColors = ["", "#EF4444", "#F97316", "#EAB308", "#22C55E"];
  const pwLabels = ["", "Weak", "Fair", "Good", "Strong"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          friendlyApiMessage(
            data.message,
            "We couldn't reset your password right now.",
          ),
        );
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Password updated!</h1>
        <p className="text-[#64748B] text-sm mb-6">
          Redirecting you to sign in…
        </p>
        <Link
          href="/login"
          className="text-[#3B82F6] text-sm font-semibold hover:underline"
        >
          Go to sign in →
        </Link>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#0F172A] mb-1">Set new password</h1>
        <p className="text-[#64748B] text-sm">Choose something you&apos;ll actually remember.</p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New password */}
        <div>
          <label className="block text-sm font-medium text-[#334155] mb-1.5">
            New password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 pr-11 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition text-lg"
            >
              {showPassword ? "◡" : "◉"}
            </button>
          </div>

          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{ backgroundColor: pwStrength >= i ? pwColors[pwStrength] : "#E2E8F0" }}
                  />
                ))}
              </div>
              {pwStrength > 0 && (
                <p className="mt-1 text-xs" style={{ color: pwColors[pwStrength] }}>
                  {pwLabels[pwStrength]} password
                </p>
              )}
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-[#334155] mb-1.5">
            Confirm password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError("");
            }}
            placeholder="Re-enter new password"
            autoComplete="new-password"
            className={`w-full rounded-xl border bg-white px-4 py-3 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:ring-3 transition
              ${confirm && confirm !== password
                ? "border-red-400 focus:border-red-400 focus:ring-red-400/15"
                : confirm && confirm === password
                ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/15"
                : "border-[#CBD5E1] focus:border-[#3B82F6] focus:ring-[#3B82F6]/15"
              }`}
          />
          {confirm && confirm !== password && (
            <p className="mt-1 text-xs text-red-500">Passwords don&apos;t match</p>
          )}
          {confirm && confirm === password && (
            <p className="mt-1 text-xs text-emerald-600">✓ Passwords match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold py-3.5 text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-[#1E3A8A]/30"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Updating…
            </span>
          ) : (
            "Update password"
          )}
        </button>
      </form>
    </div>
  );
}
