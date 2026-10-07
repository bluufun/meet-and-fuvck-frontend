"use client";

import ActivationCard from "@/components/dashboard/ActivationCard";
import EditProfileModal from "@/components/dashboard/EditProfileModal";
import MediaGallery from "@/components/dashboard/MediaGallery";
import ProfileDetailsCard from "@/components/dashboard/ProfileDetailsCard";
import ReferralCard from "@/components/dashboard/ReferralCard";
import VerifiedBadge from "@/components/dashboard/VerifiedBadge";
import DesktopSidebar from "@/components/DesktopSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import WalletModal from "@/components/wallet/WalletModal";
import { isGoldTier } from "@/lib/boostTiers";
import TierChip from "@/components/TierBadge";
import { invalidateUserEverywhere } from "@/lib/apiCache";
import { getProtectedRouteDecision } from "@/lib/routeAccess";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type VerificationState = "not_started" | "pending" | "approved" | "rejected";
type ReviewState = VerificationState | "manual_review_pending";

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

function CoinWalletIcon() {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className='h-5.5 w-5.5 drop-shadow-[0_2px_4px_rgba(120,53,15,0.35)]'
      fill='none'>
      <defs>
        <linearGradient
          id='coin-wallet-body'
          x1='5'
          y1='5'
          x2='19'
          y2='19'
          gradientUnits='userSpaceOnUse'>
          <stop offset='0%' stopColor='#FFF6BF' />
          <stop offset='38%' stopColor='#FCD34D' />
          <stop offset='72%' stopColor='#F59E0B' />
          <stop offset='100%' stopColor='#B45309' />
        </linearGradient>
        <radialGradient
          id='coin-wallet-shine'
          cx='0'
          cy='0'
          r='1'
          gradientTransform='translate(8.2 7.5) rotate(35) scale(8.8 8.2)'
          gradientUnits='userSpaceOnUse'>
          <stop offset='0%' stopColor='#FFF9DB' stopOpacity='0.95' />
          <stop offset='60%' stopColor='#FFF9DB' stopOpacity='0.18' />
          <stop offset='100%' stopColor='#FFF9DB' stopOpacity='0' />
        </radialGradient>
        <linearGradient
          id='coin-wallet-rim'
          x1='6'
          y1='6'
          x2='18'
          y2='18'
          gradientUnits='userSpaceOnUse'>
          <stop offset='0%' stopColor='#FFF8D6' />
          <stop offset='45%' stopColor='#F59E0B' />
          <stop offset='100%' stopColor='#92400E' />
        </linearGradient>
      </defs>

      <circle cx='12' cy='12.5' r='7.9' fill='rgba(255,255,255,0.12)' />
      <circle
        cx='12'
        cy='12'
        r='7.35'
        fill='url(#coin-wallet-body)'
        stroke='url(#coin-wallet-rim)'
        strokeWidth='1.15'
      />
      <ellipse
        cx='9.1'
        cy='8.2'
        rx='4.2'
        ry='2.7'
        fill='url(#coin-wallet-shine)'
      />
      <circle
        cx='12'
        cy='12'
        r='5.15'
        stroke='rgba(255,255,255,0.42)'
        strokeWidth='0.85'
      />
      <circle cx='12' cy='12' r='1.65' fill='#FFF3B0' opacity='0.95' />
      <path
        d='M8.7 9.3c.8-.9 1.9-1.4 3.3-1.4 1 0 1.8.2 2.5.7.6.4.9 1 .9 1.7 0 .8-.4 1.4-1.1 1.8-.7.4-1.6.7-2.8.8-1 .1-1.6.2-2 .5-.4.2-.6.5-.6.9 0 .5.2.8.7 1.1.4.2 1 .3 1.6.3 1.3 0 2.3-.4 3.1-1.2'
        stroke='rgba(127, 29, 29, 0.22)'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.45'
      />
      <path
        d='M8.7 9.3c.8-.9 1.9-1.4 3.3-1.4 1 0 1.8.2 2.5.7.6.4.9 1 .9 1.7 0 .8-.4 1.4-1.1 1.8-.7.4-1.6.7-2.8.8-1 .1-1.6.2-2 .5-.4.2-.6.5-.6.9 0 .5.2.8.7 1.1.4.2 1 .3 1.6.3 1.3 0 2.3-.4 3.1-1.2'
        stroke='#FFF8C2'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='0.9'
      />
      <path
        d='M9.3 6.6c1-.7 2.2-1.1 3.6-1.1 2 0 3.6.7 4.8 2.2'
        stroke='rgba(255,255,255,0.45)'
        strokeLinecap='round'
        strokeWidth='1'
      />
    </svg>
  );
}

interface ProfileMediaItem {
  key: string;
  url: string;
  isVideo: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser, logout, loading: authLoading } = useAuth();
  const [mediaItems, setMediaItems] = useState<ProfileMediaItem[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletOpenTopup, setWalletOpenTopup] = useState(false);
  const [walletTopupCoins, setWalletTopupCoins] = useState<
    number | undefined
  >();
  const verificationStatus: ReviewState =
    user?.verificationStatus || "not_started";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role === "funmate") {
      fetchMedia();
    }
  }, [authLoading, router, user]);

  const isFunmate = user?.role === "funmate";
  const isSeeker = user?.role === "seeker";
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "";
  const verificationApproved = verificationStatus === "approved";
  const boostTier = user?.boostTier || "regular";
  const showVerifiedBadge = !!user?.isVerified;
  const goldenBadge = isGoldTier(boostTier);
  const galleryReady =
    Boolean(user?.galleryCompleted) || (user?.profileMedia?.length ?? 0) >= 2;
  const routeDecision = user
    ? getProtectedRouteDecision("/dashboard", user)
    : { allowed: true as const };
  const shouldRedirectAway =
    !routeDecision.allowed && Boolean(routeDecision.redirectTo);

  useEffect(() => {
    if (!shouldRedirectAway || !routeDecision.redirectTo) return;
    router.replace(routeDecision.redirectTo);
  }, [routeDecision.redirectTo, router, shouldRedirectAway]);

  async function fetchMedia() {
    try {
      const res = await fetch(`${API}/api/media/profile-urls`, {
        headers: authHeader(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setMediaItems(data.media || []);
    } catch {
      // ignore
    }
  }

  async function refreshUser() {
    try {
      const res = await fetch(`${API}/api/auth/me`, { headers: authHeader() });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.user) {
        setUser(data.user);
        invalidateUserEverywhere(data.user.username);
      }
    } catch {
      // ignore
    }
  }

  if (authLoading || !user) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F8FAFF]'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent' />
      </div>
    );
  }

  if (shouldRedirectAway) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F8FAFF]'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent' />
      </div>
    );
  }

  return (
    <div
      className='min-h-screen bg-gradient-to-b from-[#F8FAFF] to-[#EEF2FF] pb-5 lg:pl-24'
      style={{ WebkitTextSizeAdjust: "none" }}>
      <DesktopSidebar showLogo={false} />
      <div className='mx-auto w-full max-w-6xl px-4 py-6 pb-12 lg:px-6 xl:px-8'>
        <div className='lg:grid lg:grid-cols-[minmax(0,1.35fr)_380px] lg:gap-6'>
          <main className='space-y-3'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <h1 className='text-lg font-bold text-[#0F172A] lg:text-xl'>
                  Dashboard
                </h1>
                <p className='text-xs text-[#94A3B8] lg:text-sm'>
                  {new Date().toLocaleDateString("en-NG", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className='rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#64748B] transition hover:border-red-200 hover:text-red-500'>
                Log out
              </button>
            </div>

            <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#3B82F6] p-5 shadow-xl shadow-[#1E3A8A]/20 lg:p-6'>
              <div className='absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5' />
              <div className='absolute right-10 bottom-0 h-24 w-24 rounded-full bg-white/5' />
              <div className='relative flex items-center gap-3'>
                <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl font-bold text-white backdrop-blur'>
                  {initials}
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-1.5'>
                    <p className='truncate text-lg font-bold text-white'>
                      {user.name}
                    </p>
                    {showVerifiedBadge && (
                      <VerifiedBadge golden={goldenBadge} />
                    )}
                  </div>
                  <p className='text-xs text-white/70'>
                    @{user.username} · {user.role ?? "member"}
                  </p>
                  <div className='mt-2 flex flex-wrap gap-1.5'>
                    {user.emailisVerified ? (
                      <Badge color='emerald'>Email verified</Badge>
                    ) : (
                      <Badge color='red'>Email unverified</Badge>
                    )}
                    {isFunmate && verificationStatus === "approved" && (
                      <Badge color='emerald'>ID verified</Badge>
                    )}
                    {isFunmate &&
                      (verificationStatus === "pending" ||
                        verificationStatus === "manual_review_pending") && (
                        <Badge color='amber'>
                          {verificationStatus === "manual_review_pending"
                            ? "ID under review"
                            : "ID pending"}
                        </Badge>
                      )}
                    {isFunmate && verificationStatus === "rejected" && (
                      <Badge color='red'>ID rejected</Badge>
                    )}
                    {isFunmate && user.isActivated && (
                      <TierChip tier={boostTier} size='sm' variant='overlay' />
                    )}
                  </div>
                </div>
                {isFunmate && (
                  <button
                    onClick={() => setEditOpen(true)}
                    className='shrink-0 rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/25'>
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className='rounded-2xl border border-[#E2E8F0] bg-white p-4 lg:flex lg:items-center lg:justify-between lg:gap-4'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 ring-1 ring-amber-900/10'>
                  <CoinWalletIcon />
                </div>
                <div>
                  <p className='text-sm font-bold text-[#0F172A]'>
                    Coin Wallet
                  </p>
                  <p className='text-xs text-[#94A3B8]'>
                    Top up and manage your coins
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setWalletOpenTopup(false);
                  setWalletOpen(true);
                }}
                className='mt-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2 text-xs font-semibold text-[#1E3A8A] transition-transform active:scale-95 lg:mt-0'>
                See Wallet
              </button>
            </div>

            {isSeeker && (
              <div className='overflow-hidden rounded-3xl border border-[#DBEAFE] bg-gradient-to-br from-[#EFF6FF] via-white to-[#E0F2FE] p-4 shadow-[0_18px_50px_rgba(37,99,235,0.12)]'>
                <div className='flex md:items-start items-center gap-3 flex-col md:flex-row '>
                  <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-white shadow-sm'>
                    <Image
                      src='/uploads/girl-icon.png'
                      alt='Girl icon'
                      width={200}
                      height={200}
                    />
                  </div>
                  <div className='min-w-0 flex-1 text-center md:text-left'>
                    <p className='text-sm font-bold text-[#0F172A]'>
                      Browse beautiful funmates around your city
                    </p>
                    <p className='mt-1 text-xs leading-relaxed text-[#64748B]'>
                      Discover premium profiles near you and start connecting
                      with people who match your vibe.
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/")}
                    className='shrink-0 rounded-xl bg-[#1E3A8A] px-3.5 py-2 text-xs font-bold text-white transition-transform active:scale-95'>
                    Discover new funmate
                  </button>
                </div>
              </div>
            )}

            {isFunmate && (
              <>
                {!verificationApproved && verificationStatus === "pending" && (
                  <Banner
                    icon='🛡'
                    title='Verification pending'
                    text='Your FaceVerify session is still being processed.'
                  />
                )}
                {!verificationApproved &&
                  verificationStatus === "manual_review_pending" && (
                    <Banner
                      icon='🕵️'
                      title='Verification under manual review'
                      text='Our team is checking your verification request now.'
                    />
                  )}
                {!verificationApproved && verificationStatus === "rejected" && (
                  <div className='mb-3 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4'>
                    <span className='shrink-0 text-lg text-red-500'>⚠</span>
                    <div className='flex-1'>
                      <p className='text-sm font-semibold text-red-700'>
                        Verification rejected
                      </p>
                      <p className='mb-3 mt-0.5 text-xs leading-relaxed text-red-500'>
                        Your verification was rejected. Please resubmit with a
                        clearer selfie and a fresh FaceVerify check.
                      </p>
                      <button
                        onClick={() => router.push("/verification")}
                        className='rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white'>
                        Resubmit verification
                      </button>
                    </div>
                  </div>
                )}

                {verificationApproved && (
                  <ActivationCard
                    activationStatus={user.activationStatus}
                    isActivated={user.isActivated}
                    boostTier={user.boostTier}
                    boostStatus={user.boostStatus}
                    onActivated={refreshUser}
                    onTopUpClick={(coins) => {
                      setWalletOpenTopup(true);
                      setWalletTopupCoins(coins);
                      setWalletOpen(true);
                    }}
                  />
                )}
              </>
            )}

            <div className='lg:hidden'>
              <ReferralCard />
            </div>

            {isFunmate && (
              <>
                <MediaGallery
                  items={mediaItems}
                  onRefresh={fetchMedia}
                  onActivated={refreshUser}
                />
                <ProfileDetailsCard
                  user={user}
                  onEdit={() => setEditOpen(true)}
                />

                <div className='rounded-2xl border border-[#E2E8F0] bg-white p-4'>
                  <div className='mb-2 flex items-center justify-between'>
                    <p className='text-sm font-semibold text-[#0F172A]'>
                      Vibe bio
                    </p>
                    <button
                      onClick={() => setEditOpen(true)}
                      className='text-xs font-medium text-[#1E3A8A]'>
                      Edit
                    </button>
                  </div>
                  {user.vibeBio ? (
                    <p className='text-sm leading-relaxed text-[#334155]'>
                      {user.vibeBio}
                    </p>
                  ) : (
                    <p className='text-sm italic text-[#CBD5E1]'>
                      No bio yet - tap Edit to add one
                    </p>
                  )}
                </div>

                <div className='overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white'>
                  {[
                    {
                      label: "Complete onboarding",
                      href: "/onboarding/funmate",
                      show: !user.isProfileComplete,
                    },
                    {
                      label: "Submit verification",
                      href: "/verification",
                      show:
                        verificationStatus !== "approved" &&
                        user.isProfileComplete,
                    },
                  ]
                    .filter((l) => l.show)
                    .map((link) => (
                      <button
                        key={link.href}
                        onClick={() => router.push(link.href)}
                        className='flex w-full items-center justify-between border-b border-[#F1F5F9] px-4 py-3.5 text-left transition hover:bg-[#F8FAFF] last:border-0'>
                        <span className='text-sm text-[#0F172A]'>
                          {link.label}
                        </span>
                        <span className='text-[#94A3B8]'>→</span>
                      </button>
                    ))}
                </div>
              </>
            )}
          </main>

          <aside className='hidden space-y-4 lg:block lg:sticky lg:top-6'>
            <ReferralCard />

            <div className='rounded-3xl border border-[#E2E8F0] bg-white p-5 shadow-sm'>
              <p className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-400'>
                Quick actions
              </p>
              <div className='mt-4 space-y-2'>
                <button
                  onClick={() => setEditOpen(true)}
                  className='w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50'>
                  Edit profile
                </button>
                <button
                  onClick={() => {
                    setWalletOpenTopup(false);
                    setWalletOpen(true);
                  }}
                  className='w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50'>
                  Open wallet
                </button>
                <button
                  onClick={() => router.push("/activity")}
                  className='w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50'>
                  View activity
                </button>
                {user.role === "funmate" && !user.isProfileComplete && (
                  <button
                    onClick={() => router.push("/onboarding/funmate")}
                    className='w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50'>
                    Finish onboarding
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {editOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setUser(updated);
          }}
        />
      )}

      <WalletModal
        open={walletOpen}
        openTopup={walletOpenTopup}
        onClose={() => {
          setWalletOpen(false);
          setWalletOpenTopup(false);
          setWalletTopupCoins(undefined);
        }}
        initialTopupCoins={walletTopupCoins}
      />
    </div>
  );
}

function Badge({
  color,
  children,
}: {
  color: "emerald" | "red" | "amber" | "violet";
  children: ReactNode;
}) {
  const styles: Record<string, string> = {
    emerald: "bg-emerald-400/20 text-emerald-200 border-emerald-300/30",
    red: "bg-red-400/20 text-red-200 border-red-300/30",
    amber: "bg-amber-400/20 text-amber-200 border-amber-300/30",
    violet: "bg-violet-400/20 text-violet-200 border-violet-300/30",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles[color]}`}>
      {children}
    </span>
  );
}

function Banner({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className='mb-3 flex gap-3 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4'>
      <span className='shrink-0 text-lg text-[#3B82F6]'>{icon}</span>
      <div>
        <p className='text-sm font-semibold text-[#1E40AF]'>{title}</p>
        <p className='mt-0.5 text-xs leading-relaxed text-[#3B82F6]'>{text}</p>
      </div>
    </div>
  );
}
