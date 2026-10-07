"use client";

import { useAuth } from "@/hooks/useAuth";
import { friendlyApiError } from "@/lib/apiMessages";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerificationReviewPage() {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const displayName = user?.name?.trim() || "there";

  useEffect(() => {
    if (loading || !user) return;

    if (user.verificationStatus === "approved") {
      router.replace("/dashboard");
      return;
    }

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const checkStatus = async () => {
      if (cancelled) return;
      setChecking(true);
      try {
        await refreshUser();
      } catch (error) {
        if (!cancelled) {
          setStatusNote(
            friendlyApiError(
              error,
              "We could not refresh your verification status just now.",
            ),
          );
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    void checkStatus();
    pollTimer = setInterval(() => {
      void checkStatus();
    }, 15000);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [loading, refreshUser, router, user]);

  if (loading) {
    return (
      <div className='flex h-[80vh] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(180deg,_#F8FBFF_0%,_#EEF4FF_100%)] px-4'>
        <div className='rounded-[2rem] border border-white/70 bg-white/90 px-6 py-5 text-center shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur'>
          <div className='mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent' />
          <p className='text-sm font-semibold text-[#0F172A]'>
            Loading review status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-[80vh] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(180deg,_#F8FBFF_0%,_#EEF4FF_100%)] px-4 py-8'>
      <div className='w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/90 p-6 text-center shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8'>
        <div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600'>
          ⏳
        </div>
        <p className='text-xs font-semibold uppercase tracking-[0.24em] text-amber-600'>
          Under review
        </p>
        <h1 className='mt-2 text-2xl font-bold text-[#0F172A]'>
          Your verification is being reviewed
        </h1>
        <p className='mt-3 text-sm leading-7 text-[#64748B]'>
          Thanks, {displayName}. Our team has received your verification request
          and will review it shortly. You do not need to resubmit right now.
        </p>
        <div className='mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm leading-6 text-sky-900'>
          {checking
            ? "Checking for an approval update..."
            : "This page will refresh your status automatically while you wait."}
        </div>
        {statusNote && (
          <div className='mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm leading-6 text-rose-700'>
            {statusNote}
          </div>
        )}
        <div className='mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm leading-6 text-amber-900'>
          We&apos;ll email you once the review is complete. If we need anything
          else, we&apos;ll let you know from here.
        </div>
        <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center'>
          <button
            onClick={() => router.push("/contact")}
            className='w-full rounded-xl border border-[#CBD5E1] bg-white px-5 py-3 text-sm font-semibold text-[#334155] transition hover:bg-slate-50 sm:w-auto'>
            Contact support
          </button>
        </div>
      </div>
    </div>
  );
}
