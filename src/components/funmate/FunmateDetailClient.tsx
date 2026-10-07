"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FunmateMediaShowcase from "@/components/funmate/FunmateMediaShowcase";
import {
  IdentityHeader,
  VibeSpotlight,
  BioQuote,
  BasicsSection,
  EducationWorkSection,
  AppearanceSection,
  LookingForSection,
  ExperiencesSection,
  BookingRatesSection,
} from "@/components/funmate/Funmatedetailsections";
import WhatsAppLockCard from "@/components/funmate/Whatsapplockcard";
import { getCachedData, setCachedData } from "@/lib/apiCache";
import { normalizeMediaUrls, type FunmateDetail } from "@/lib/funmate";
import ReportDrawer from "@/components/funmate/ReportDrawer";
import ShareModal from "@/components/funmate/ShareModal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

interface FunmateDetailClientProps {
  username: string;
  initialFunmate?: FunmateDetail | null;
}

export default function FunmateDetailClient({
  username,
  initialFunmate = null,
}: FunmateDetailClientProps) {
  const router = useRouter();

  const [funmate, setFunmate] = useState<FunmateDetail | null>(initialFunmate);
  const [loading, setLoading] = useState(!initialFunmate);
  const [notFound, setNotFound] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [viewsOverride, setViewsOverride] = useState<number | null>(null);
  const recordedViewFor = useRef<string | null>(null);

  useEffect(() => {
    if (initialFunmate) {
      queueMicrotask(() => {
        setFunmate(initialFunmate);
        setLoading(false);
        setNotFound(false);
      });
    }
  }, [initialFunmate]);

  useEffect(() => {
    if (initialFunmate || !username) return;
    let cancelled = false;

    (async () => {
      const cacheKey = `funmate:${username}`;
      const cached = getCachedData<FunmateDetail>(cacheKey);

      if (cached) {
        setFunmate(cached);
        setLoading(false);
        setNotFound(false);
        return;
      }

      setLoading(true);
      setNotFound(false);
      try {
        const res = await fetch(`${API}/api/funmates/${username}`, {
          headers: authHeader(),
        });
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const incoming = data.funmate as FunmateDetail | undefined;
        if (!cancelled && incoming) {
          const withUrls = {
            ...incoming,
            mediaUrls: normalizeMediaUrls(incoming),
          };
          setCachedData(cacheKey, withUrls);
          setFunmate(withUrls);
        }
      } catch (err) {
        console.error("[FunmateDetailClient] fetch error:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialFunmate, username]);

  // Record a view once the profile has actually loaded, and only once per
  // username per mount. Runs client-side (not during SSR) so we can attach
  // the viewer's token when they're logged in, letting the backend exclude
  // someone viewing their own profile.
  useEffect(() => {
    if (!funmate || !username) return;
    if (recordedViewFor.current === username) return;
    recordedViewFor.current = username;

    const token = localStorage.getItem("bf_token");
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    fetch(`${API}/api/funmates/${encodeURIComponent(username)}/view`, {
      method: "POST",
      headers,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.profileViews === "number") {
          setViewsOverride(data.profileViews);
        }
      })
      .catch(() => {
        // Non-critical — the profile still shows its last known view count.
      });
  }, [funmate, username]);

  if (loading) {
    return (
      <div className='min-h-screen bg-[#F8FAFF] flex items-center justify-center lg:pl-24'>
        <div className='w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin' />
      </div>
    );
  }

  if (notFound || !funmate) {
    return (
      <div className='min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center px-6 text-center lg:pl-24'>
        <p className='text-base font-bold text-[#0F172A] mb-1'>
          Profile not found
        </p>
        <p className='text-sm text-[#94A3B8] mb-5'>
          This funmate may no longer be available.
        </p>
        <button
          onClick={() => router.back()}
          className='text-sm font-semibold text-white bg-[#1E3A8A] px-5 py-2.5 rounded-xl'>
          Go back
        </button>
      </div>
    );
  }

  const location = [funmate.lga, funmate.state].filter(Boolean).join(", ");

  return (
    // lg:pl-24 offsets the fixed 96px DesktopSidebar rendered by FunmatePageChrome.
    <div className='min-h-screen bg-[#F8FAFF] pb-[calc(60px+env(safe-area-inset-bottom)+1.5rem)] lg:pb-16 lg:pl-24'>
      <div className='mx-auto w-full max-w-[800px] lg:max-w-[1080px] lg:px-8'>
        {/*
          Mobile: media on top, details stacked below (unchanged).
          Desktop (lg:+): media becomes a sticky left column next to a
          readable details column, instead of stretching one narrow phone
          card down the middle of a wide screen.
        */}
        <div className='lg:grid lg:grid-cols-[440px_minmax(0,1fr)] lg:items-start lg:gap-12 lg:pt-5'>
          <div className='lg:sticky lg:top-10 lg:overflow-hidden lg:rounded-[2rem] lg:border lg:border-slate-200 lg:shadow-[0_30px_80px_rgba(15,23,42,0.12)]'>
            <FunmateMediaShowcase
              urls={funmate.mediaUrls ?? []}
              name={funmate.name}
              onBack={() => router.back()}
            />
          </div>

          <div className='lg:pb-14'>
            <IdentityHeader
              username={funmate.username}
              age={funmate.age}
              location={location}
              isVerified={funmate.isVerified}
              boostTier={funmate.boostTier}
              profileViews={viewsOverride ?? funmate.profileViews}
              reportAction={
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => setShareOpen(true)}
                    className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50'>
                    Share
                  </button>
                  <button
                    onClick={() => setReportOpen(true)}
                    className='inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100'>
                    Report
                  </button>
                </div>
              }
            />

            <LookingForSection intent={funmate.intent} />

            <VibeSpotlight currentWant={funmate.currentWant} />

            <WhatsAppLockCard
              username={funmate.username}
              unlocked={!!funmate.whatsappUnlocked}
              whatsapp={funmate.whatsapp}
              locked={Boolean(
                "whatsappLocked" in funmate && funmate.whatsappLocked,
              )}
              priceNgn={Number(funmate.whatsappUnlockPriceNgn || 0)}
            />

            <BioQuote bio={funmate.vibeBio} />

            <BasicsSection
              age={funmate.age}
              location={location}
              gender={funmate.gender}
              orientation={funmate.orientation}
            />
            <BookingRatesSection bookingRates={funmate.bookingRates} />

            <EducationWorkSection
              education={funmate.education}
              occupation={funmate.occupation}
            />

            <AppearanceSection
              bodyType={funmate.bodyType}
              height={funmate.height}
              skinTone={funmate.skinTone}
              bustSize={funmate.bustSize}
            />

            <ExperiencesSection experiences={funmate.experiences} />
          </div>
        </div>
      </div>
      <ReportDrawer
        username={funmate.username}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        url={`${SITE_URL}/funmate/${funmate.username}`}
        username={funmate.username}
      />
    </div>
  );
}
