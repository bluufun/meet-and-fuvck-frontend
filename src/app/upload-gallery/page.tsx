"use client";

import MediaGallery from "@/components/dashboard/MediaGallery";
import { useAuth } from "@/hooks/useAuth";
import { friendlyApiMessage } from "@/lib/apiMessages";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { getProtectedRouteDecision } from "@/lib/routeAccess";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type MediaItem = {
  key: string;
  url: string;
  isVideo: boolean;
};

export default function UploadGalleryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, setUser } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const redirectTo = !loading && user ? getProtectedRouteDecision("/upload-gallery", user).redirectTo : null;
  const shouldHoldForRedirect = Boolean(redirectTo && redirectTo !== pathname);

  const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

  useIsomorphicLayoutEffect(() => {
    if (!shouldHoldForRedirect || !redirectTo) return;
    router.replace(redirectTo);
  }, [redirectTo, router, shouldHoldForRedirect]);

  async function loadMedia() {
    setLoadingMedia(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/media/profile-urls`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          friendlyApiMessage(data.message, "We couldn't load your gallery."),
        );
      }
      setItems(data.media || []);
    } catch (err) {
      setError(friendlyApiMessage(err, "We couldn't load your gallery."));
    } finally {
      setLoadingMedia(false);
    }
  }

  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== "funmate") return;
    void loadMedia();
  }, [loading, user]);

  const ready = useMemo(() => {
    const photos = items.filter((item) => !item.isVideo).length;
    return items.length >= 2 && photos >= 1;
  }, [items]);
  async function handleContinue() {
    if (!ready) return;
    setRedirecting(true);
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      const nextUser = data?.user;
      if (res.ok && nextUser) {
        setUser(nextUser);
      }
      router.replace(
        nextUser?.verificationStatus === "approved"
          ? "/dashboard"
          : "/verification",
      );
    } catch {
      router.replace("/verification");
    } finally {
      setRedirecting(false);
    }
  }

  if (loading || !user || shouldHoldForRedirect) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F8FAFF] px-4'>
        <div className='rounded-3xl border border-white/70 bg-white/90 px-5 py-4 shadow-lg flex items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent' />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(180deg,_#F8FBFF_0%,_#EEF4FF_100%)] px-4 py-6 lg:px-6 lg:py-10'>
      <div className='mx-auto max-w-3xl'>
        <div className='mb-6 rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[#94A3B8]'>
            Upload gallery
          </p>
          <h1 className='mt-2 text-3xl font-black tracking-tight text-[#0F172A]'>
            Add at least 2 media before verification
          </h1>
          <p className='mt-2 max-w-2xl text-sm leading-7 text-slate-600'>
            Your funmate profile needs a small gallery first. Upload at least
            two items, with at least one photo, then continue to verification.
          </p>
          {error && (
            <div className='mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
              {error}
            </div>
          )}
          <div className='mt-4 flex flex-wrap gap-3'>
            <span className='rounded-full border border-[#DBEAFE] bg-[#F8FBFF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]'>
              2 media minimum
            </span>
            <span className='rounded-full border border-[#DBEAFE] bg-[#F8FBFF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]'>
              1 photo required
            </span>
            <span className='rounded-full border border-[#DBEAFE] bg-[#F8FBFF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]'>
              Video optional
            </span>
          </div>
        </div>

        <MediaGallery
          items={items}
          onRefresh={loadMedia}
          onboardingMode
          allowDirectEdits
        />

        <div className='mt-5 flex flex-col gap-3 sm:flex-row'>
          <button
            type='button'
            onClick={() => router.push("/onboarding/funmate")}
            className='rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700'>
            Back to onboarding
          </button>
          <button
            type='button'
            onClick={handleContinue}
            disabled={!ready}
            className='rounded-2xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50'>
            {ready ? "Continue to verification" : "Upload required media first"}
          </button>
        </div>
      </div>
    </div>
  );
}
