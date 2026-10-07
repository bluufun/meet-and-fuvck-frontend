"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { friendlyApiMessage } from "@/lib/apiMessages";

type Step = "email" | "code" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function startCooldown() {
    setResendCooldown(30);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1 && cooldownRef.current) clearInterval(cooldownRef.current);
        return s - 1;
      });
    }, 1000);
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return setError("Please enter your email address.");

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok)
        return setError(
          friendlyApiMessage(
            data.message,
            "We couldn't send that request right now.",
          ),
        );

      setStep("code");
      startCooldown();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      startCooldown();
    } catch {
      setError("Could not resend code. Try again.");
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 4) return setError("Enter the 4-digit code.");

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok)
        return setError(
          friendlyApiMessage(
            data.message,
            "That code is invalid or has expired.",
          ),
        );

      setResetToken(data.resetToken);
      setStep("password");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok)
        return setError(
          friendlyApiMessage(
            data.message,
            "We couldn't reset your password right now.",
          ),
        );

      setDone(true);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Password updated</h1>
        <p className="text-[#64748B] text-sm leading-relaxed mb-6 max-w-xs mx-auto">
          You can now sign in with your new password.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="inline-flex items-center gap-1 text-[#3B82F6] text-sm font-semibold hover:underline"
        >
          Go to sign in →
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-[#64748B] text-sm hover:text-[#334155] mb-5 transition"
        >
          ← Back
        </Link>
        <h1 className="text-[28px] font-bold text-[#0F172A] mb-1">
          {step === "email" && "Reset your password"}
          {step === "code" && "Enter verification code"}
          {step === "password" && "Set a new password"}
        </h1>
        <p className="text-[#64748B] text-sm">
          {step === "email" && "Enter your email and we'll send you a code."}
          {step === "code" && (
            <>
              We sent a 4-digit code to <strong>{email}</strong>.
            </>
          )}
          {step === "password" && "Choose a new password for your account."}
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {step === "email" && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold py-3.5 text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-[#1E3A8A]/30"
          >
            {loading ? "Sending code…" : "Send code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1.5">
              Verification code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="1234"
              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[#0F172A] text-lg tracking-[0.5em] text-center placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold py-3.5 text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-[#1E3A8A]/30"
          >
            {loading ? "Verifying…" : "Verify code"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="w-full text-center text-sm text-[#3B82F6] font-semibold hover:underline disabled:text-[#94A3B8] disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1.5">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#334155] mb-1.5">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold py-3.5 text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-[#1E3A8A]/30"
          >
            {loading ? "Saving…" : "Save new password"}
          </button>
        </form>
      )}
    </div>
  );
}
