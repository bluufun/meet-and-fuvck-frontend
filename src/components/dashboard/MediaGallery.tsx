"use client";

import Image from "next/image";
import { useState } from "react";
import MediaViewerModal from "./MediaViewerModal";
import ManageMediaModal from "./ManageMediaModal";
import { useAuth } from "@/hooks/useAuth";
import { getMediaLimit } from "@/lib/boostTiers";
import { activateAccount } from "@/lib/activation";
import { friendlyApiMessage } from "@/lib/apiMessages";

interface MediaItem {
  key: string;
  url: string;
  isVideo: boolean;
}

interface MediaGalleryProps {
  items: MediaItem[];
  onRefresh: () => void;
  onActivated?: () => Promise<void> | void;
  onboardingMode?: boolean;
  allowDirectEdits?: boolean;
}

export default function MediaGallery({
  items,
  onRefresh,
  onActivated,
  onboardingMode = false,
  allowDirectEdits = false,
}: MediaGalleryProps) {
  const { user } = useAuth();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState("");

  const isFunmate = user?.role === "funmate";
  const isVerified = user?.verificationStatus === "approved";
  const isActivated = !!user?.isActivated;
  const maxItems = getMediaLimit(user?.boostTier);
  const canManageMedia = onboardingMode ? true : !isFunmate || (isVerified && isActivated);
  const needsMediaForVisibility = !onboardingMode && isFunmate && isActivated && items.length === 0;
  const galleryLockedForActivation = !onboardingMode && isFunmate && !isActivated;

  async function handleActivate() {
    setActivationError("");
    setActivating(true);
    try {
      const { res, data } = await activateAccount();
      if (!res.ok) {
        setActivationError(
          friendlyApiMessage(
            data.message,
            "We couldn't activate the account right now.",
          ),
        );
        return;
      }
      await onActivated?.();
      onRefresh();
    } catch {
      setActivationError("Something went wrong. Please try again.");
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className='bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-3'>
      <div className='flex items-center justify-between mb-3'>
        <div>
          <p className='text-sm font-semibold text-[#0F172A]'>Gallery</p>
          <p className='text-xs text-[#94A3B8]'>
            {items.length}/{maxItems} items
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setSampleOpen(true)}
            className='text-xs font-medium text-[#1E3A8A] bg-[#EFF6FF] px-3 py-1.5 rounded-full'>
            See sample
          </button>
          {canManageMedia && (
            <button
              onClick={() => setManageOpen(true)}
              className='text-xs font-medium text-[#1E3A8A] bg-[#EFF6FF] px-3 py-1.5 rounded-full'>
              Edit / Delete
            </button>
          )}
        </div>
      </div>

      {needsMediaForVisibility && (
        <div className='mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
          <p className='font-semibold'>Your profile is activated, but hidden from the feed.</p>
          <p className='mt-1 text-xs leading-6 text-amber-800'>
            Upload at least one photo or video to make your profile visible on the funmate feed.
          </p>
          <button
            type='button'
            onClick={() => setManageOpen(true)}
            className='mt-3 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700'>
            Upload media now
          </button>
        </div>
      )}

      <div className='relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white'>
        <div className='grid grid-cols-3 gap-2 p-1.5 sm:p-2'>
          {items.length === 0 ? (
            <button
              onClick={() => setManageOpen(true)}
              className='col-span-3 aspect-[3/1.4] rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFF] flex flex-col items-center justify-center gap-2 transition hover:border-[#3B82F6]'>
              <svg
                className='w-7 h-7 text-[#94A3B8]'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={1.6}>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
              <span className='text-xs font-medium text-[#94A3B8]'>
                Add your first photos or videos
              </span>
            </button>
          ) : (
            items.map((item, i) => (
              <button
                key={item.key}
                onClick={() => setViewerIndex(i)}
                className='relative aspect-[3/4] overflow-hidden rounded-xl group focus:outline-none'>
                {item.isVideo ? (
                  <>
                    <video
                      src={item.url}
                      className='h-full w-full object-cover'
                      muted
                      preload='metadata'
                    />
                    <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
                      <div className='flex h-9 w-9 items-center justify-center rounded-full bg-white/90'>
                        <svg
                          className='h-4 w-4 translate-x-[1px] text-[#1E3A8A]'
                          fill='currentColor'
                          viewBox='0 0 24 24'>
                          <path d='M8 5v14l11-7z' />
                        </svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={item.url}
                    alt={`Media ${i + 1}`}
                    loading='lazy'
                    decoding='async'
                    className='h-full w-full object-cover transition-transform group-hover:scale-105'
                  />
                )}
              </button>
            ))
          )}
        </div>

        {galleryLockedForActivation && (
          <div className='absolute inset-0 z-10 flex items-center justify-center bg-black/55 px-4 backdrop-blur-[1px]'>
            <div className='w-full max-w-sm rounded-[1.75rem] border border-white/15 bg-white/12 px-5 py-5 text-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-md'>
              <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15'>
                <svg
                  className='h-6 w-6 text-white'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={1.8}>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                  />
                </svg>
              </div>
              <p className='text-sm font-bold'>Gallery is locked</p>
              <p className='mt-1 text-xs leading-6 text-white/75'>
                Activate your account before people can discover your profile.
              </p>
              {activationError && (
                <p className='mt-3 rounded-2xl bg-rose-500/15 px-3 py-2 text-left text-[11px] font-medium text-rose-100'>
                  {activationError}
                </p>
              )}
              <button
                type='button'
                onClick={handleActivate}
                disabled={activating}
                className='mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#1E3A8A] transition disabled:opacity-60'>
                {activating ? (
                  <>
                    <span className='h-4 w-4 animate-spin rounded-full border-2 border-[#1E3A8A]/30 border-t-[#1E3A8A]' />
                    Activating...
                  </>
                ) : (
                  "Activate account"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {viewerIndex !== null && (
        <MediaViewerModal
          items={items}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}

      {manageOpen && canManageMedia && (
        <ManageMediaModal
          items={items}
          maxItems={maxItems}
          onClose={() => setManageOpen(false)}
          onChanged={onRefresh}
          canManageMedia={canManageMedia}
          showPlanLimits={!onboardingMode}
          allowDirectEdits={allowDirectEdits}
        />
      )}

      {sampleOpen && (
        <div className='fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/55 px-4 py-4 sm:items-center '>
          <div className='w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] md:h-screen'>
            <div className='flex items-center justify-between border-b border-slate-100 px-4 py-3'>
              <div>
                <p className='text-sm font-semibold text-slate-950'>
                  Sample image
                </p>
                <p className='text-xs text-slate-500'>
                  This is the kind of photo to upload.
                </p>
              </div>
              <button
                type='button'
                onClick={() => setSampleOpen(false)}
                className='rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700'>
                Close
              </button>
            </div>
            <div className='bg-slate-950 p-4'>
              <div className='overflow-hidden rounded-2xl border border-white/10 bg-black'>
                <Image
                  src='/uploads/dress_guide_watermarked.png'
                  alt='Sample media to guide profile uploads'
                  width={900}
                  height={1200}
                  className='h-auto md:h-[78vh] w-full object-cover'
                  unoptimized
                  priority
                />
              </div>
            </div>
            <div className='px-4 pb-4 text-xs leading-6 text-slate-500'>
              Use a clear, well-framed image that matches your profile style.
              This sample is shown for guidance only.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
