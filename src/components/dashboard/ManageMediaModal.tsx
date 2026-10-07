"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { uploadMediaFile } from "@/lib/uploadMedia";
import { invalidateUserEverywhere } from "@/lib/apiCache";
import { clearFeedState } from "@/lib/feedState";
import { useAuth } from "@/hooks/useAuth";
import { MEDIA_LIMIT_DISPLAY, getMediaQuota } from "@/lib/boostTiers";
import { friendlyApiError, friendlyApiMessage } from "@/lib/apiMessages";
import { UploadStepError } from "@/lib/uploadMedia";
import { X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 20 * 1024 * 1024;
const VIDEO_KEY_PATTERN = /\.(mp4|webm|mov)$/i;

interface MediaItem {
  key: string;
  url: string;
  isVideo: boolean;
}

interface PendingUpload {
  id: string;
  file: File;
  previewUrl: string;
  isVideo: boolean;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  key?: string;
}

interface ManageMediaModalProps {
  items: MediaItem[];
  maxItems: number;
  onClose: () => void;
  onChanged: () => void;
  canManageMedia?: boolean;
  showPlanLimits?: boolean;
  allowDirectEdits?: boolean;
}

type PickerMode = "add" | "replace";

type ReplacementRequest = {
  _id: string;
  oldKey: string;
  newKey: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

function isVideoKey(key: string) {
  return VIDEO_KEY_PATTERN.test(key);
}

export default function ManageMediaModal({
  items,
  maxItems,
  onClose,
  onChanged,
  canManageMedia = true,
  showPlanLimits = true,
  allowDirectEdits = false,
}: ManageMediaModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [draftItems, setDraftItems] = useState<MediaItem[]>(items);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(
    null,
  );
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [replacingProgress, setReplacingProgress] = useState(0);
  const [pickerMode, setPickerMode] = useState<PickerMode>("add");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<PendingUpload[]>([]);
  const [replacementRequests, setReplacementRequests] = useState<
    ReplacementRequest[]
  >([]);
  const quota = getMediaQuota(user?.boostTier);

  useEffect(() => {
    // The portal must wait for the client body to exist before rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    setDraftItems(items);
  }, [items]);

  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const update = () => setIsDesktop(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const res = await fetch(`${API}/api/media/replacements/mine`, {
          headers: authHeader(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        setReplacementRequests((data.requests || []) as ReplacementRequest[]);
      } catch {
        setReplacementRequests([]);
      }
    };

    void loadRequests();
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted, onClose]);

  const visibleItems = allowDirectEdits ? draftItems : items;
  const liveCount =
    visibleItems.length + pending.filter((p) => p.status !== "error").length;
  const slotsLeft = maxItems - liveCount;
  const isUploading = pending.some((p) => p.status === "uploading");
  const hasNewDone = pending.some((p) => p.status === "done");
  const hasErrors = pending.some((p) => p.status === "error");
  const isLocked = !canManageMedia;
  const canDeleteMedia = allowDirectEdits ? true : items.length > 2;
  const pendingReplacementKeys = new Set(
    replacementRequests
      .filter((request) => request.status === "pending")
      .map((request) => request.oldKey),
  );
  const existingCounts = items.reduce(
    (acc, item) => {
      if (isVideoKey(item.key)) acc.videos += 1;
      else acc.photos += 1;
      return acc;
    },
    { photos: 0, videos: 0 },
  );

  function handlePickFiles() {
    setPickerMode("add");
    setReplaceIndex(null);
    fileInputRef.current?.click();
  }

  function handleReplaceMedia(index: number) {
    if (replacingIndex !== null) return;
    if (allowDirectEdits) {
      setDraftItems((current) =>
        current.filter((_, itemIndex) => itemIndex !== index),
      );
      setConfirmDeleteIndex(null);
      setReplaceIndex(index);
      setPickerMode("add");
      fileInputRef.current?.click();
      return;
    }
    setPickerMode("replace");
    setReplaceIndex(index);
    fileInputRef.current?.click();
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    if (pickerMode === "replace" && !allowDirectEdits) {
      const target = replaceIndex;
      const file = files[0];
      if (typeof target !== "number" || !items[target]) return;

      const isVideo = file.type.startsWith("video/");
      const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
      if (file.size > maxBytes) {
        alert(`${file.name} is too large. Max ${isVideo ? "20MB" : "5MB"}.`);
        return;
      }

      setSaving(true);
      setReplacingIndex(target);
      setReplacingProgress(0);
      try {
        const { key } = await uploadMediaFile(file, "profile", (pct) => {
          setReplacingProgress(pct);
        });
        const res = await fetch(`${API}/api/media/replacements`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({
            oldKey: items[target].key,
            newKey: key,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data.message || "Replacement request failed");

        setReplacementRequests((current) => [
          {
            _id: data.request?._id || `${Date.now()}`,
            oldKey: items[target].key,
            newKey: key,
            status: "pending",
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);

        alert("Your replacement request has been sent for review.");
        onChanged();
      } catch (err) {
        alert(friendlyApiError(err, "Could not submit replacement request."));
      } finally {
        setSaving(false);
        setReplacingIndex(null);
        setReplacingProgress(0);
        setPickerMode("add");
        setReplaceIndex(null);
      }
      return;
    }

    const allowed = files.slice(0, Math.max(0, slotsLeft));
    if (files.length > allowed.length) {
      alert(
        `You can only add ${slotsLeft} more item${
          slotsLeft === 1 ? "" : "s"
        } (max ${maxItems} total).`,
      );
    }

    const currentCounts = pending.reduce(
      (acc, item) => {
        if (item.status === "error") return acc;
        if (item.isVideo) acc.videos += 1;
        else acc.photos += 1;
        return acc;
      },
      { photos: existingCounts.photos, videos: existingCounts.videos },
    );

    let rejectedPhotos = 0;
    let rejectedVideos = 0;

    allowed.forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
      if (file.size > maxBytes) {
        alert(`${file.name} is too large. Max ${isVideo ? "20MB" : "5MB"}.`);
        return;
      }

      if (isVideo && currentCounts.videos >= quota.videos) {
        rejectedVideos += 1;
        return;
      }

      if (!isVideo && currentCounts.photos >= quota.photos) {
        rejectedPhotos += 1;
        return;
      }

      if (isVideo) currentCounts.videos += 1;
      else currentCounts.photos += 1;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      setPending((p) => [
        ...p,
        { id, file, previewUrl, isVideo, progress: 0, status: "uploading" },
      ]);

      uploadMediaFile(file, "profile", (pct) => {
        setPending((p) =>
          p.map((x) => (x.id === id ? { ...x, progress: pct } : x)),
        );
      })
        .then(({ key }) => {
          setPending((p) =>
            p.map((x) =>
              x.id === id ? { ...x, status: "done", key, progress: 100 } : x,
            ),
          );
        })
        .catch((err) => {
          const stepHint =
            err instanceof UploadStepError ? ` [${err.step}]` : "";
          setPending((p) =>
            p.map((x) =>
              x.id === id
                ? {
                    ...x,
                    status: "error",
                    error: `${friendlyApiError(err, "Upload failed.")}${stepHint}`,
                  }
                : x,
            ),
          );
        });
    });

    if (rejectedPhotos || rejectedVideos) {
      alert(
        `Plan limit reached: ${quota.photos} photos and ${quota.videos} videos maximum.`,
      );
    }
  }

  function removePending(id: string) {
    setPending((p) => {
      const found = p.find((x) => x.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return p.filter((x) => x.id !== id);
    });
  }

  async function handleDeleteExisting(index: number) {
    if (!canDeleteMedia) return;
    if (allowDirectEdits) {
      setDraftItems((current) =>
        current.filter((_, itemIndex) => itemIndex !== index),
      );
      setConfirmDeleteIndex(null);
      return;
    }
    setDeletingIndex(index);
    try {
      const res = await fetch(`${API}/api/media/profile/${index}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      if (!res.ok) throw new Error("Delete failed");
      invalidateUserEverywhere(user?.username);
      clearFeedState();
      onChanged();
    } catch {
      alert("Could not delete this item. Please try again.");
    } finally {
      setDeletingIndex(null);
      setConfirmDeleteIndex(null);
    }
  }

  async function handleSaveNew() {
    const newKeys = pending
      .filter((p) => p.status === "done" && p.key)
      .map((p) => p.key as string);
    if (newKeys.length === 0) return;

    setSaving(true);
    try {
      const mediaKeys = [...items.map((i) => i.key), ...newKeys];
      const draftKeys = allowDirectEdits
        ? [...draftItems.map((i) => i.key), ...newKeys]
        : mediaKeys;
      const res = await fetch(`${API}/api/media/confirm-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ mediaKeys: draftKeys }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          friendlyApiMessage(
            data.message,
            "We couldn't save your media right now.",
          ),
        );
      }
      invalidateUserEverywhere(user?.username);
      clearFeedState();
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPending([]);
      onChanged();
    } catch (err) {
      alert(friendlyApiError(err, "We couldn't save your media right now."));
    } finally {
      setSaving(false);
    }
  }

  const lockedContent = (
    <div
      className='fixed inset-0 z-[80] flex items-center justify-center px-4'
      style={{ background: "rgba(15,23,42,0.6)" }}>
      <div className='w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl'>
        <div className='border-b border-slate-100 px-5 py-4'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400'>
                Gallery controls
              </p>
              <h2 className='mt-1 text-base font-bold text-[#0F172A]'>
                Upload locked
              </h2>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900'
              aria-label='Close gallery manager'>
              <X className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='px-5 py-6'>
          <div className='rounded-2xl border border-rose-200 bg-[#FFF7F8] px-4 py-4 text-center'>
            <p className='text-sm font-semibold text-[#9F1239]'>
              Only activated funmates can upload media.
            </p>
            <p className='mt-1 text-xs leading-6 text-[#BE123C]'>
              Activate your account first, then come back here to add photos or
              videos to your gallery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const mediaGuardNotice =
    allowDirectEdits || canDeleteMedia ? null : (
      <div className='mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
        You must always keep at least two approved media on your profile.
      </div>
    );

  const mobileContent = (
    <div
      className='fixed inset-0 z-[65] flex flex-col justify-end'
      style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className='max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white'>
        <div className='sticky top-0 z-10 flex items-center justify-between border-b border-[#F1F5F9] bg-white px-5 py-4'>
          <div>
            <h2 className='text-base font-bold text-[#0F172A]'>
              Manage gallery
            </h2>
            <p className='mt-0.5 text-xs text-[#94A3B8]'>
              {liveCount}/{maxItems} used - photos & videos
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-xl leading-none text-[#94A3B8]'>
            x
          </button>
        </div>

        <div className='p-5'>
          {mediaGuardNotice}
          <div className='grid grid-cols-3 gap-2.5'>
            {visibleItems.map((item, i) => (
              <div
                key={item.key}
                className='group relative aspect-[3/4] overflow-hidden rounded-xl bg-[#F1F5F9]'>
                {item.isVideo ? (
                  <video
                    src={item.url}
                    className='h-full w-full object-cover'
                    muted
                    preload='metadata'
                  />
                ) : (
                  <img
                    src={item.url}
                    alt=''
                    loading='lazy'
                    decoding='async'
                    className='h-full w-full object-cover'
                  />
                )}
                {item.isVideo && (
                  <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15'>
                    <div className='flex h-7 w-7 items-center justify-center rounded-full bg-white/90'>
                      <svg
                        className='h-3.5 w-3.5 translate-x-[1px] text-[#1E3A8A]'
                        fill='currentColor'
                        viewBox='0 0 24 24'>
                        <path d='M8 5v14l11-7z' />
                      </svg>
                    </div>
                  </div>
                )}

                {!allowDirectEdits && pendingReplacementKeys.has(item.key) && (
                  <div className='absolute left-2 bottom-2 rounded-full border text-center border-amber-200 bg-amber-50/95 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.16em] text-amber-700 shadow-sm backdrop-blur'>
                    Replacement pending
                  </div>
                )}

                {confirmDeleteIndex === i ? (
                  <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-2'>
                    <p className='text-center text-[11px] font-medium text-white'>
                      Remove this?
                    </p>
                    <div className='flex gap-1.5'>
                      <button
                        onClick={() => handleDeleteExisting(i)}
                        disabled={deletingIndex === i}
                        className='rounded-lg bg-red-600 px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-60'>
                        {deletingIndex === i ? "..." : "Yes, remove"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteIndex(null)}
                        className='rounded-lg bg-white/20 px-2.5 py-1.5 text-[10px] font-semibold text-white'>
                        No
                      </button>
                    </div>
                  </div>
                ) : replacingIndex === i ? (
                  <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-3'>
                    <svg
                      className='h-5 w-5 animate-spin text-white'
                      fill='none'
                      viewBox='0 0 24 24'>
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
                      />
                    </svg>
                    <p className='text-[10px] font-semibold text-white'>
                      Uploading... {replacingProgress}%
                    </p>
                    <div className='h-1 w-full max-w-[80%] overflow-hidden rounded-full bg-white/25'>
                      <div
                        className='h-full rounded-full bg-white transition-all'
                        style={{ width: `${replacingProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className='absolute right-1.5 top-1.5 flex flex-col gap-1'>
                    <button
                      onClick={() => handleReplaceMedia(i)}
                      disabled={replacingIndex !== null}
                      className='rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-60'>
                      Replace
                    </button>
                    <button
                      disabled={!canDeleteMedia || replacingIndex !== null}
                      onClick={() => setConfirmDeleteIndex(i)}
                      className='flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-black/25'>
                      <svg
                        className='h-3.5 w-3.5'
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
                    </button>
                  </div>
                )}
              </div>
            ))}

            {pending.map((p) => (
              <div
                key={p.id}
                className='relative aspect-[3/4] overflow-hidden rounded-xl bg-[#F1F5F9]'>
                {p.isVideo ? (
                  <video
                    src={p.previewUrl}
                    className='h-full w-full object-cover'
                    muted
                    preload='metadata'
                  />
                ) : (
                  <img
                    src={p.previewUrl}
                    alt=''
                    loading='lazy'
                    decoding='async'
                    className='h-full w-full object-cover'
                  />
                )}

                {p.status === "uploading" && (
                  <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55'>
                    <div className='h-9 w-9 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                    <p className='text-[11px] font-semibold text-white'>
                      Uploading... {p.progress}%
                    </p>
                    <div className='h-1 w-3/4 overflow-hidden rounded-full bg-white/25'>
                      <div
                        className='h-full rounded-full bg-white transition-all'
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {p.status === "done" && (
                  <div className='absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500'>
                    <svg
                      className='h-3 w-3 text-white'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      strokeWidth={3}>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </div>
                )}

                {p.status === "error" && (
                  <div className='absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-900/75 p-2 text-center'>
                    <p className='text-[10px] text-white'>
                      {p.error || "Upload failed"}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => removePending(p.id)}
                  className='absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white'>
                  <svg
                    className='h-3.5 w-3.5'
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
                </button>
              </div>
            ))}

            {slotsLeft > 0 && (
              <button
                onClick={handlePickFiles}
                className='flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFF] transition hover:border-[#3B82F6]'>
                <svg
                  className='h-6 w-6 text-[#94A3B8]'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={1.8}>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 4v16m8-8H4'
                  />
                </svg>
                <span className='text-[10px] font-medium text-[#94A3B8]'>
                  Add
                </span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime'
            multiple={pickerMode === "add"}
            onChange={handleFilesSelected}
            className='hidden'
          />

          <p className='mt-4 text-xs leading-relaxed text-[#94A3B8]'>
            Up to {quota.photos} photos and {quota.videos} videos. Images max
            5MB, videos max 20MB.
          </p>

          {showPlanLimits && (
            <div className='mt-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] p-3'>
              <p className='mb-1.5 text-[11px] font-semibold text-[#0F172A]'>
                Media limits by plan
              </p>
              <div className='space-y-1'>
                {MEDIA_LIMIT_DISPLAY.map((tier) => (
                  <div
                    key={tier.label}
                    className='flex items-center justify-between gap-3 text-[11px]'>
                    <span className='text-[#64748B]'>{tier.label}</span>
                    <span className='font-medium text-[#0F172A]'>
                      {tier.photos} photos · {tier.videos} videos
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  onClose();
                  router.push("/boost");
                }}
                className='mt-2 w-full rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] py-2 text-[11px] font-semibold text-[#1E3A8A]'>
                Upgrade for more media
              </button>
            </div>
          )}

          {hasErrors && (
            <p className='mt-2 text-xs text-red-500'>
              Some uploads failed - remove them and try again.
            </p>
          )}

          {!allowDirectEdits &&
            replacementRequests.some(
              (request) => request.status === "pending",
            ) && (
              <div className='mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900'>
                You have a media replacement under review. The current gallery
                stays live until approval.
              </div>
            )}
        </div>

        <div className='sticky bottom-0 flex gap-3 border-t border-[#F1F5F9] bg-white p-4'>
          <button
            onClick={onClose}
            className='flex-1 rounded-xl border border-[#E2E8F0] py-3.5 text-sm font-medium text-[#64748B]'>
            Close
          </button>
          <button
            onClick={handleSaveNew}
            disabled={!hasNewDone || isUploading || saving}
            className='flex-1 rounded-xl bg-[#1E3A8A] py-3.5 text-sm font-semibold text-white disabled:opacity-50'>
            {saving
              ? "Saving..."
              : isUploading
                ? "Uploading..."
                : "Save new media"}
          </button>
        </div>
      </div>
    </div>
  );

  const desktopContent = (
    <div className='fixed inset-0 z-[80]' aria-hidden={false}>
      <div
        onClick={onClose}
        className='absolute inset-0 bg-slate-950/20 backdrop-blur-md transition-opacity duration-300'
      />

      <aside
        onClick={(event) => event.stopPropagation()}
        className='absolute bottom-0 right-4 flex h-[min(86vh,760px)] w-[min(980px,calc(100vw-50rem))] flex-col overflow-hidden rounded-t-[2rem] border border-slate-200 bg-white shadow-[0_-24px_80px_rgba(15,23,42,0.16)] transition-transform duration-300 ease-out'
        style={{ transform: "translateY(0)" }}>
        <div className='shrink-0 border-b border-slate-100 px-6 pb-4 pt-5'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400'>
                Gallery controls
              </p>
              <h2 className='mt-2 text-base font-bold text-[#0F172A]'>
                Manage gallery
              </h2>
              <p className='mt-1 text-sm leading-6 text-slate-600'>
                {liveCount}/{maxItems} used - photos & videos
              </p>
            </div>

            <button
              type='button'
              onClick={onClose}
              className='flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900'
              aria-label='Close gallery manager'>
              <X className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto px-6 py-5'>
          {mediaGuardNotice}
          <div className='grid grid-cols-3 gap-2.5'>
            {visibleItems.map((item, i) => (
              <div
                key={item.key}
                className='group relative aspect-[3/4] overflow-hidden rounded-xl bg-[#F1F5F9]'>
                {item.isVideo ? (
                  <video
                    src={item.url}
                    className='h-full w-full object-cover'
                    muted
                    preload='metadata'
                  />
                ) : (
                  <img
                    src={item.url}
                    alt=''
                    loading='lazy'
                    decoding='async'
                    className='h-full w-full object-cover'
                  />
                )}
                {item.isVideo && (
                  <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15'>
                    <div className='flex h-7 w-7 items-center justify-center rounded-full bg-white/90'>
                      <svg
                        className='h-3.5 w-3.5 translate-x-[1px] text-[#1E3A8A]'
                        fill='currentColor'
                        viewBox='0 0 24 24'>
                        <path d='M8 5v14l11-7z' />
                      </svg>
                    </div>
                  </div>
                )}

                {!allowDirectEdits && pendingReplacementKeys.has(item.key) && (
                  <div className='absolute left-2 bottom-2 rounded-full border border-amber-200 bg-amber-50/95 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.16em] text-amber-700 shadow-sm backdrop-blur'>
                    Replacement pending
                  </div>
                )}

                {confirmDeleteIndex === i ? (
                  <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-2'>
                    <p className='text-center text-[11px] font-medium text-white'>
                      Remove this?
                    </p>
                    <div className='flex gap-1.5'>
                      <button
                        onClick={() => handleDeleteExisting(i)}
                        disabled={deletingIndex === i}
                        className='rounded-lg bg-red-600 px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-60'>
                        {deletingIndex === i ? "..." : "Yes, remove"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteIndex(null)}
                        className='rounded-lg bg-white/20 px-2.5 py-1.5 text-[10px] font-semibold text-white'>
                        No
                      </button>
                    </div>
                  </div>
                ) : replacingIndex === i ? (
                  <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-3'>
                    <svg
                      className='h-5 w-5 animate-spin text-white'
                      fill='none'
                      viewBox='0 0 24 24'>
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
                      />
                    </svg>
                    <p className='text-[10px] font-semibold text-white'>
                      Uploading... {replacingProgress}%
                    </p>
                    <div className='h-1 w-full max-w-[80%] overflow-hidden rounded-full bg-white/25'>
                      <div
                        className='h-full rounded-full bg-white transition-all'
                        style={{ width: `${replacingProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className='absolute right-1.5 top-1.5 flex flex-col gap-1'>
                    <button
                      onClick={() => handleReplaceMedia(i)}
                      disabled={replacingIndex !== null}
                      className='rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-60'>
                      Replace
                    </button>
                    <button
                      disabled={!canDeleteMedia || replacingIndex !== null}
                      onClick={() => setConfirmDeleteIndex(i)}
                      className='flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-black/25'>
                      <svg
                        className='h-3.5 w-3.5'
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
                    </button>
                  </div>
                )}
              </div>
            ))}

            {pending.map((p) => (
              <div
                key={p.id}
                className='relative aspect-[3/4] overflow-hidden rounded-xl bg-[#F1F5F9]'>
                {p.isVideo ? (
                  <video
                    src={p.previewUrl}
                    className='h-full w-full object-cover'
                    muted
                    preload='metadata'
                  />
                ) : (
                  <img
                    src={p.previewUrl}
                    alt=''
                    loading='lazy'
                    decoding='async'
                    className='h-full w-full object-cover'
                  />
                )}

                {p.status === "uploading" && (
                  <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55'>
                    <div className='h-9 w-9 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                    <p className='text-[11px] font-semibold text-white'>
                      Uploading... {p.progress}%
                    </p>
                    <div className='h-1 w-3/4 overflow-hidden rounded-full bg-white/25'>
                      <div
                        className='h-full rounded-full bg-white transition-all'
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {p.status === "done" && (
                  <div className='absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500'>
                    <svg
                      className='h-3 w-3 text-white'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      strokeWidth={3}>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </div>
                )}

                {p.status === "error" && (
                  <div className='absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-900/75 p-2 text-center'>
                    <p className='text-[10px] text-white'>
                      {p.error || "Upload failed"}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => removePending(p.id)}
                  className='absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white'>
                  <svg
                    className='h-3.5 w-3.5'
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
                </button>
              </div>
            ))}

            {slotsLeft > 0 && (
              <button
                onClick={handlePickFiles}
                className='flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFF] transition hover:border-[#3B82F6]'>
                <svg
                  className='h-6 w-6 text-[#94A3B8]'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={1.8}>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 4v16m8-8H4'
                  />
                </svg>
                <span className='text-[10px] font-medium text-[#94A3B8]'>
                  Add
                </span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime'
            multiple={pickerMode === "add"}
            onChange={handleFilesSelected}
            className='hidden'
          />

          <p className='mt-4 text-xs leading-relaxed text-[#94A3B8]'>
            Up to {quota.photos} photos and {quota.videos} videos. Images max
            5MB, videos max 20MB.
          </p>

          {showPlanLimits && (
            <div className='mt-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] p-3'>
              <p className='mb-1.5 text-[11px] font-semibold text-[#0F172A]'>
                Media limits by plan
              </p>
              <div className='space-y-1'>
                {MEDIA_LIMIT_DISPLAY.map((tier) => (
                  <div
                    key={tier.label}
                    className='flex items-center justify-between gap-3 text-[11px]'>
                    <span className='text-[#64748B]'>{tier.label}</span>
                    <span className='font-medium text-[#0F172A]'>
                      {tier.photos} photos · {tier.videos} videos
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  onClose();
                  router.push("/boost");
                }}
                className='mt-2 w-full rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] py-2 text-[11px] font-semibold text-[#1E3A8A]'>
                Upgrade for more media
              </button>
            </div>
          )}

          {hasErrors && (
            <p className='mt-2 text-xs text-red-500'>
              Some uploads failed - remove them and try again.
            </p>
          )}

          {!allowDirectEdits &&
            replacementRequests.some(
              (request) => request.status === "pending",
            ) && (
              <div className='mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900'>
                You have a media replacement under review. The current gallery
                stays live until approval.
              </div>
            )}
        </div>

        <div className='shrink-0 border-t border-[#F1F5F9] bg-white p-4'>
          <div className='flex gap-3'>
            <button
              onClick={onClose}
              className='flex-1 rounded-xl border border-[#E2E8F0] py-3.5 text-sm font-medium text-[#64748B]'>
              Close
            </button>
            <button
              onClick={handleSaveNew}
              disabled={!hasNewDone || isUploading || saving}
              className='flex-1 rounded-xl bg-[#1E3A8A] py-3.5 text-sm font-semibold text-white disabled:opacity-50'>
              {saving
                ? "Saving..."
                : isUploading
                  ? "Uploading..."
                  : "Save new media"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );

  if (!mounted) return null;

  return createPortal(
    isLocked ? lockedContent : isDesktop ? desktopContent : mobileContent,
    document.body,
  );
}
