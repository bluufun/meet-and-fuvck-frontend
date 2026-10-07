"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { friendlyApiMessage } from "@/lib/apiMessages";
import { createPortal } from "react-dom";

// ── Icons (stroke-based, no emoji) ───────────────────────────────────────────
function Icon({
  name,
  className = "w-5 h-5",
}: {
  name: string;
  className?: string;
}) {
  const icons: Record<string, React.ReactElement> = {
    party: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
        />
      </svg>
    ),
    eyeOpen: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
        />
        <circle cx='12' cy='12' r='3' />
      </svg>
    ),
    eyeOff: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M3 3l18 18M10.584 10.587a2 2 0 002.828 2.83M9.363 5.365A9.466 9.466 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411M6.423 6.423A9.992 9.992 0 002.458 12c1.274 4.057 5.065 7 9.542 7a9.965 9.965 0 004.575-1.114'
        />
      </svg>
    ),
    warning: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
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
    x: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={2.5}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M6 18L18 6M6 6l12 12'
        />
      </svg>
    ),
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
  };
  return icons[name] ?? <span className={className} />;
}

// ── Success Modal ─────────────────────────────────────────────────────────────
function SuccessModal({
  name,
  onContinue,
}: {
  name: string;
  onContinue: () => void;
}) {
  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center px-4'>
      <div className='absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm' />

      <div className='relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-[fadeUp_0.3s_ease]'>
        <div className='mx-auto mb-5 w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center'>
          <Icon name='party' className='w-7 h-7 text-[#1E3A8A]' />
        </div>

        <h2 className='text-xl font-bold text-[#0F172A] mb-2'>
          Welcome, {name}!
        </h2>
        <p className='text-[#64748B] text-sm leading-relaxed mb-6'>
          Your account has been created successfully. Let&apos;s set up your
          profile so people can find your kind of fun.
        </p>

        <div className='flex justify-center gap-1.5 mb-6'>
          {["#3B82F6", "#60A5FA", "#1E3A8A", "#93C5FD", "#BFDBFE"].map(
            (c, i) => (
              <div
                key={i}
                className='w-2 h-2 rounded-full'
                style={{ backgroundColor: c }}
              />
            ),
          )}
        </div>

        <button
          onClick={onContinue}
          className='w-full rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold py-3.5 text-sm transition shadow-sm shadow-[#1E3A8A]/30'>
          Verify Email →
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ── Username availability indicator ──────────────────────────────────────────
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function UsernameStatusLabel({ status }: { status: UsernameStatus }) {
  if (status === "idle") return null;
  if (status === "checking")
    return <span className='text-[#94A3B8] text-xs ml-1'>Checking…</span>;
  if (status === "available")
    return (
      <span className='inline-flex items-center gap-0.5 text-emerald-600 text-xs ml-1 font-medium'>
        <Icon name='check' className='w-3 h-3' /> Available
      </span>
    );
  if (status === "taken")
    return (
      <span className='inline-flex items-center gap-0.5 text-red-500 text-xs ml-1 font-medium'>
        <Icon name='x' className='w-3 h-3' /> Already taken
      </span>
    );
  if (status === "invalid")
    return (
      <span className='text-orange-500 text-xs ml-1'>
        Only letters, numbers and underscores
      </span>
    );
  return null;
}

// ── Main Register Page ────────────────────────────────────────────────────────
function RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const errorRef = useRef<HTMLDivElement | null>(null);

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    whatsapp: "",
    referralCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [createdName, setCreatedName] = useState("");
  const [referralLocked, setReferralLocked] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Prefill referral code from ?ref=CODE share links
  useEffect(() => {
    const ref = searchParams?.get("ref");
    if (ref) {
      queueMicrotask(() => {
        setForm((prev) => ({ ...prev, referralCode: ref.toUpperCase() }));
        setReferralLocked(true);
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!error) return;
    errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [error]);

  // Password strength
  const pwStrength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  })();

  const pwLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const pwColors = ["", "#EF4444", "#F97316", "#EAB308", "#22C55E"];

  // Username debounce check
  useEffect(() => {
    const username = form.username.trim();
    if (!username) {
      queueMicrotask(() => setUsernameStatus("idle"));
      return;
    }
    if (username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
      queueMicrotask(() => setUsernameStatus("invalid"));
      return;
    }

    queueMicrotask(() => setUsernameStatus("checking"));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}/api/auth/check-username?username=${encodeURIComponent(username)}`,
        );
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        queueMicrotask(() => setUsernameStatus("idle"));
      }
    }, 500);
  }, [form.username, API]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "username"
          ? value.toLowerCase().replace(/[^a-z0-9_]/g, "")
          : value,
    }));
    setError("");
  }

  function handleReferralChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
    setForm((prev) => ({ ...prev, referralCode: value }));
  }

  // Format WhatsApp: strip non-digits, ensure starts with country code
  function handleWhatsappChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
    setForm((prev) => ({ ...prev, whatsapp: raw }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.username || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (usernameStatus === "taken") {
      setError("That username is already taken.");
      return;
    }
    if (usernameStatus === "invalid") {
      setError("Username can only contain letters, numbers and underscores.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          referralCode: form.referralCode.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          friendlyApiMessage(
            data.message,
            "We couldn't create your account right now.",
          ),
        );
        return;
      }

      localStorage.setItem("bf_token", data.token);
      setUser(data.user);
      setCreatedName(data.user.name.split(" ")[0]);
      setShowModal(true);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleModalContinue() {
    setShowModal(false);
    router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
  }

  return (
    <>
      {showModal && (
        <SuccessModal name={createdName} onContinue={handleModalContinue} />
      )}
      <div>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-[28px] font-bold text-[#0F172A] mb-1'>
            Create your account
          </h1>
          <p className='text-[#64748B] text-sm'>
            Already have one?{" "}
            <Link
              href='/login'
              className='text-[#3B82F6] font-semibold hover:underline'>
              Sign in
            </Link>
          </p>
        </div>

        {/* Step badge */}
        <div className='mb-6 inline-flex items-center gap-2 bg-[#EFF6FF] rounded-full px-3 py-1.5'>
          <div className='flex gap-1'>
            <div className='w-2 h-2 rounded-full bg-[#3B82F6]' />
            <div className='w-2 h-2 rounded-full bg-[#CBD5E1]' />
          </div>
          <span className='text-[#3B82F6] text-xs font-semibold'>
            Step 1 of 2 — Account info
          </span>
        </div>

        {/* Referral banner — only shown when arriving via a share link */}
        {referralLocked && form.referralCode && (
          <div className='mb-5 flex items-center gap-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-3'>
            <Icon name='gift' className='w-4 h-4 text-[#1E3A8A] shrink-0' />
            <p className='text-[#1E3A8A] text-xs'>
              You were invited with code{" "}
              <span className='font-semibold'>{form.referralCode}</span>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            ref={errorRef}
            className='mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3'>
            <Icon
              name='warning'
              className='w-4 h-4 text-red-500 mt-0.5 shrink-0'
            />
            <p className='text-red-700 text-sm'>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Full name */}
          <div>
            <label className='block text-sm font-medium text-[#334155] mb-1.5'>
              Full name
            </label>
            <input
              type='text'
              name='name'
              value={form.name}
              onChange={handleChange}
              placeholder='Your real name (stays private)'
              autoComplete='name'
              className='w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 transition'
            />
          </div>

          {/* Username */}
          <div>
            <div className='flex items-center justify-between mb-1.5'>
              <label className='block text-sm font-medium text-[#334155]'>
                Username
              </label>
              <UsernameStatusLabel status={usernameStatus} />
            </div>
            <div className='relative'>
              <span className='absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm select-none'>
                @
              </span>
              <input
                type='text'
                name='username'
                value={form.username}
                onChange={handleChange}
                placeholder='your_username'
                maxLength={20}
                className={`w-full rounded-xl border bg-white pl-8 pr-4 py-3 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:ring-3 transition
                  ${
                    usernameStatus === "available"
                      ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/15"
                      : usernameStatus === "taken" ||
                          usernameStatus === "invalid"
                        ? "border-red-400 focus:border-red-400 focus:ring-red-400/15"
                        : "border-[#CBD5E1] focus:border-[#3B82F6] focus:ring-[#3B82F6]/15"
                  }`}
              />
            </div>
            <p className='mt-1 text-xs text-[#94A3B8]'>
              3–20 chars · letters, numbers, underscores only · this also
              becomes your referral code
            </p>
          </div>

          {/* Email */}
          <div>
            <label className='block text-sm font-medium text-[#334155] mb-1.5'>
              Email address
            </label>
            <input
              type='email'
              name='email'
              value={form.email}
              onChange={handleChange}
              placeholder='you@example.com'
              autoComplete='email'
              className='w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 transition'
            />
          </div>

          {/* WhatsApp number */}
          <div>
            <div className='flex items-center justify-between mb-1.5'>
              <label className='text-sm font-medium text-[#334155]'>
                WhatsApp number
              </label>
            </div>
            <input
              type='tel'
              name='whatsapp'
              value={form.whatsapp}
              onChange={handleWhatsappChange}
              placeholder='e.g. 08012345678'
              maxLength={11}
              autoComplete='tel'
              className='w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition'
            />
            <p className='mt-1 text-xs text-[#94A3B8]'>
              Used by matches to reach you on WhatsApp
            </p>
          </div>

          {/* Referral code — optional */}
          <div>
            <div className='flex items-center justify-between mb-1.5'>
              <label className='text-sm font-medium text-[#334155]'>
                Referral code (optional)
              </label>
            </div>
            <div className='relative'>
              <span className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]'>
                <Icon name='gift' className='w-4 h-4' />
              </span>
              <input
                type='text'
                value={form.referralCode}
                onChange={handleReferralChange}
                placeholder='Got a code from a friend? Enter it here'
                maxLength={24}
                disabled={referralLocked}
                className='w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-4 py-3 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 transition disabled:bg-[#F8FAFF] disabled:text-[#64748B]'
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className='block text-sm font-medium text-[#334155] mb-1.5'>
              Password
            </label>
            <div className='relative'>
              <input
                type={showPassword ? "text" : "password"}
                name='password'
                value={form.password}
                onChange={handleChange}
                placeholder='Min. 6 characters'
                autoComplete='new-password'
                className='w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 pr-11 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 transition'
              />
              <button
                type='button'
                onClick={() => setShowPassword((v) => !v)}
                className='absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition'
                aria-label={showPassword ? "Hide password" : "Show password"}>
                <Icon
                  name={showPassword ? "eyeOff" : "eyeOpen"}
                  className='w-4 h-4'
                />
              </button>
            </div>

            {/* Password strength bar */}
            {form.password && (
              <div className='mt-2'>
                <div className='flex gap-1'>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className='h-1 flex-1 rounded-full transition-all duration-300'
                      style={{
                        backgroundColor:
                          pwStrength >= i ? pwColors[pwStrength] : "#E2E8F0",
                      }}
                    />
                  ))}
                </div>
                {pwStrength > 0 && (
                  <p
                    className='mt-1 text-xs'
                    style={{ color: pwColors[pwStrength] }}>
                    {pwLabels[pwStrength]} password
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type='submit'
            disabled={
              loading ||
              usernameStatus === "taken" ||
              usernameStatus === "checking"
            }
            className='mt-2 w-full rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] active:bg-[#1e3a8a] text-white font-semibold py-3.5 text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-[#1E3A8A]/30'>
            {loading ? (
              <span className='flex items-center justify-center gap-2'>
                <span className='inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                Creating account…
              </span>
            ) : (
              "Create account →"
            )}
          </button>
        </form>

        <p className='mt-5 text-center text-xs text-[#94A3B8] leading-relaxed'>
          By creating an account you agree to our{" "}
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
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterInner />
    </Suspense>
  );
}
