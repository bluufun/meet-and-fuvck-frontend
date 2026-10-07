"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { friendlyApiMessage } from "@/lib/apiMessages";
import { getPostAuthRedirect } from "@/lib/authRouting";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 4) {
      setError("Enter the 4-digit code");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          friendlyApiMessage(data.message, "That code is invalid or expired."),
        );
        return;
      }

      // Save token + user, then continue into onboarding path selection.
      localStorage.setItem("bf_token", data.token);
      setUser(data.user);

      router.replace(data.redirectTo || getPostAuthRedirect(data.user));
    } catch {
      setError("Network error — check your connection");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || !email) return;
    setResending(true);
    setResendMsg("");
    setError("");
    try {
      const res = await fetch(`${API}/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          friendlyApiMessage(
            data.message,
            "We couldn't resend the code right now.",
          ),
        );
        return;
      }
      setResendMsg("Code sent — check your inbox");
      setCountdown(60); // 60s cooldown
    } catch {
      setError("Network error — check your connection");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className='md:min-h-screen bg-[#F8FAFF] flex items-center justify-center px-4 py-1'>
      <div className='w-full max-w-md lg:max-w-lg'>
        {/* Icon */}
        <div className='mx-auto w-16 h-16 bg-[#EFF6FF] rounded-2xl flex items-center justify-center mb-6'>
          <svg
            className='w-8 h-8 text-[#3B82F6]'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={1.8}>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
            />
          </svg>
        </div>

        <h1 className='text-2xl font-bold text-[#0F172A] text-center mb-1'>
          Check your email
        </h1>
        <p className='text-[#64748B] text-sm text-center mb-7 leading-relaxed'>
          We sent a 4-digit code to
          <br />
          <span className='font-semibold text-[#0F172A]'>{email}</span>
        </p>

        {error && (
          <div className='mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5'>
            <span className='text-red-500 shrink-0'>⚠</span>
            <p className='text-red-700 text-sm'>{error}</p>
          </div>
        )}

        {resendMsg && (
          <div className='mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3'>
            <p className='text-emerald-700 text-sm text-center'>{resendMsg}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-[#334155] mb-2'>
              Verification code
            </label>
            <input
              type='text'
              inputMode='numeric'
              maxLength={4}
              value={code}
              onChange={(e) => {
                setError("");
                setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
              }}
              placeholder='0000'
              className='w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-4 text-[#0F172A] text-2xl font-mono tracking-[0.5em] text-center placeholder:text-[#CBD5E1] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-100 transition'
            />
            {code.length > 0 && code.length < 4 && (
              <p className='text-xs text-amber-500 mt-1.5 text-center'>
                {4 - code.length} more digits
              </p>
            )}
          </div>

          <button
            type='submit'
            disabled={loading || code.length !== 4}
            className='w-full bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold py-4 rounded-xl disabled:opacity-50 transition text-sm'>
            {loading ? (
              <span className='flex items-center justify-center gap-2'>
                <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                Verifying…
              </span>
            ) : (
              "Verify email"
            )}
          </button>
        </form>

        <div className='mt-6 text-center'>
          <p className='text-sm text-[#64748B]'>Didn&apos;t get it?</p>
          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className='mt-1 text-sm font-semibold text-[#3B82F6] disabled:text-[#94A3B8] disabled:cursor-not-allowed transition'>
            {resending
              ? "Sending…"
              : countdown > 0
                ? `Resend in ${countdown}s`
                : "Resend code"}
          </button>
        </div>

        <p className='text-center text-xs text-[#94A3B8] mt-8'>
          Wrong email?{" "}
          <button
            onClick={() => router.push("/login")}
            className='text-[#3B82F6] hover:underline'>
            Back to login
          </button>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
