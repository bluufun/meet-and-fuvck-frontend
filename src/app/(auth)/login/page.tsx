"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { friendlyApiMessage } from "@/lib/apiMessages";
import { getLoginRedirect, isAdminRouteUser } from "@/lib/authRouting";

type LoginResponse = {
  token: string;
  redirectTo?: string | null;
  user: any;
  message?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as LoginResponse;

      if (!res.ok) {
        setError(
          friendlyApiMessage(
            data.message,
            "We couldn't sign you in right now.",
          ),
        );
        return;
      }

      localStorage.setItem("bf_token", data.token);
      setUser(data.user);

      const redirectTarget = data.redirectTo || null;

      if (!data.user.emailisVerified) {
        await fetch(`${API}/api/auth/send-verification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.user.email }),
        }).catch(() => {});
        router.push(
          `/verify-email?email=${encodeURIComponent(data.user.email)}`,
        );
        return;
      }

      if (redirectTarget) {
        router.replace(redirectTarget);
        return;
      }

      router.replace(getLoginRedirect(data.user));
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className='mb-8'>
        <h1 className='mb-1 text-[28px] font-bold text-[#0F172A]'>
          Welcome back
        </h1>
        <p className='text-sm text-[#64748B]'>
          Don&apos;t have an account?{" "}
          <Link
            href='/register'
            className='font-semibold text-[#3B82F6] hover:underline'>
            Create one
          </Link>
        </p>
      </div>

      {error && (
        <div className='mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3'>
          <span className='mt-0.5 shrink-0 text-red-500'>⚠</span>
          <p className='text-sm text-red-700'>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='mb-1.5 block text-sm font-medium text-[#334155]'>
            Email address
          </label>
          <input
            type='email'
            name='email'
            value={form.email}
            onChange={handleChange}
            placeholder='you@example.com'
            autoComplete='email'
            className='w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15'
          />
        </div>

        <div>
          <div className='mb-1.5 flex items-center justify-between'>
            <label className='block text-sm font-medium text-[#334155]'>
              Password
            </label>
            <Link
              href='/forgot-password'
              className='text-xs text-[#3B82F6] hover:underline'>
              Forgot password?
            </Link>
          </div>
          <div className='relative'>
            <input
              type={showPassword ? "text" : "password"}
              name='password'
              value={form.password}
              onChange={handleChange}
              placeholder='Enter your password'
              autoComplete='current-password'
              className='w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 pr-11 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15'
            />
            <button
              type='button'
              onClick={() => setShowPassword((v) => !v)}
              className='absolute right-3.5 top-1/2 -translate-y-1/2 text-lg text-[#94A3B8] transition hover:text-[#64748B]'
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? "◡" : "◉"}
            </button>
          </div>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='mt-2 w-full rounded-xl bg-[#1E3A8A] py-3.5 text-sm font-semibold text-white shadow-sm shadow-[#1E3A8A]/30 transition-all duration-150 hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-60'>
          {loading ? (
            <span className='flex items-center justify-center gap-2'>
              <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className='my-6 flex items-center gap-3'>
        <div className='h-px flex-1 bg-[#E2E8F0]' />
        <span className='text-xs font-medium text-[#94A3B8]'>OR</span>
        <div className='h-px flex-1 bg-[#E2E8F0]' />
      </div>

      <p className='text-center text-xs leading-relaxed text-[#94A3B8]'>
        By continuing, you agree to our{" "}
        <Link href='/terms' className='text-[#3B82F6] hover:underline'>
          Terms
        </Link>{" "}
        and{" "}
        <Link href='/privacy' className='text-[#3B82F6] hover:underline'>
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
