"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { uploadMediaFile } from "@/lib/uploadMedia";
import { friendlyApiError, friendlyApiMessage } from "@/lib/apiMessages";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const MIN_DETAILS_LENGTH = 30;

type ReportReason =
  | "harassment"
  | "impersonation"
  | "scam"
  | "nudity"
  | "underage"
  | "hate"
  | "spam"
  | "cold_reception"
  | "fake_identity"
  | "off_platform_solicitation"
  | "other";

const REASONS: Array<{ value: ReportReason; title: string; detail: string }> = [
  {
    value: "harassment",
    title: "Harassment or abuse",
    detail: "Threats, pressure, or insulting behaviour.",
  },
  {
    value: "impersonation",
    title: "Impersonation",
    detail: "Pretending to be someone else.",
  },
  {
    value: "scam",
    title: "Scam or fraud",
    detail: "Requests for money or deceptive behaviour.",
  },
  {
    value: "nudity",
    title: "Explicit content",
    detail: "Nudity or sexual content that breaks the rules.",
  },
  {
    value: "underage",
    title: "Underage suspicion",
    detail: "Potentially under 18 or unsafe identity signals.",
  },
  {
    value: "hate",
    title: "Hate or discrimination",
    detail: "Slurs, hateful speech, or targeted abuse.",
  },
  {
    value: "spam",
    title: "Spam or misleading profile",
    detail: "Flooding, fake claims, or repeated unwanted messages.",
  },
  {
    value: "cold_reception",
    title: "Unwelcoming or dismissive behavior",
    detail:
      "The funmate was rude, dismissive, or gave a clearly hostile reception that felt unsafe or disrespectful.",
  },
  {
    value: "fake_identity",
    title: "Fake identity",
    detail: "Profile details appear fabricated or inconsistent.",
  },
  {
    value: "off_platform_solicitation",
    title: "Off-platform solicitation",
    detail: "Trying to move users off Bluufun for unsafe reasons.",
  },
  {
    value: "other",
    title: "Other",
    detail: "Something else that needs moderation.",
  },
];

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("bf_token")}` };
}

export default function ReportDrawer({
  username,
  open,
  onClose,
}: {
  username: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState<ReportReason>("harassment");
  const [details, setDetails] = useState("");
  const [subReason, setSubReason] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const reasonMeta = useMemo(
    () => REASONS.find((item) => item.value === reason) ?? REASONS[0],
    [reason],
  );

  const shortDescription = subReason.trim();
  const detailsText = details.trim();
  const canSubmit =
    shortDescription.length > 0 &&
    detailsText.length >= MIN_DETAILS_LENGTH &&
    !!proof &&
    !uploading &&
    !submitting;

  useEffect(() => {
    if (!proof) {
      setProofPreview(null);
      return;
    }
    const url = URL.createObjectURL(proof);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proof]);

  if (!mounted || !open) return null;

  async function handleSubmit() {
    const token = localStorage.getItem("bf_token");
    if (!token) {
      localStorage.setItem("bf_report_return", JSON.stringify({ username }));
      router.push(
        `/login?redirectTo=${encodeURIComponent(`/funmate/${username}`)}`,
      );
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (!shortDescription) {
        throw new Error("Short description is required.");
      }
      if (!detailsText || detailsText.length < MIN_DETAILS_LENGTH) {
        throw new Error(
          `Details must be at least ${MIN_DETAILS_LENGTH} characters long.`,
        );
      }
      if (!proof) {
        throw new Error("Proof is required.");
      }
      setUploading(true);
      const evidenceKeys: string[] = [];
      const { key } = await uploadMediaFile(proof, "report-proof", () => {});
      evidenceKeys.push(key);
      setUploading(false);

      const res = await fetch(`${API}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          reportedUsername: username,
          reason,
          subReason,
          details,
          evidenceKeys,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          friendlyApiMessage(data.message, "We couldn't submit your report."),
        );
      setDone(true);
    } catch (err) {
      setError(
        friendlyApiError(err, "We couldn't submit your report right now."),
      );
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  return createPortal(
    <div className='fixed inset-0 z-[90]'>
      <button
        onClick={onClose}
        className='absolute inset-0 bg-slate-950/45 backdrop-blur-[6px]'
      />
      <aside className='absolute right-0 top-0 h-full w-full max-w-[36rem] overflow-y-auto border-l border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]'>
        <div className='sticky top-0 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur'>
          <p className='text-[11px] font-semibold uppercase tracking-[0.26em] text-rose-500'>
            Report profile
          </p>
          <div className='mt-2 flex items-start justify-between gap-4'>
            <div>
              <h2 className='text-xl font-bold text-slate-950'>
                Help keep Bluufun safe
              </h2>
              <p className='mt-1 text-sm leading-6 text-slate-600'>
                Reports are reviewed quickly. If a profile breaks our rules, we
                act.
              </p>
            </div>
            <button
              onClick={onClose}
              className='rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600'>
              Close
            </button>
          </div>
        </div>

        <div className='space-y-5 px-5 py-5'>
          {done ? (
            <div className='rounded-3xl border border-emerald-200 bg-emerald-50 p-5'>
              <p className='text-sm font-semibold text-emerald-800'>
                Report submitted
              </p>
              <p className='mt-2 text-sm leading-6 text-emerald-700'>
                Thanks for helping us protect Bluufun. Our moderation team will
                review this report and the reporter identity will be available
                to admins for follow-up.
              </p>
              <button
                onClick={onClose}
                className='mt-4 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white'>
                Done
              </button>
            </div>
          ) : (
            <>
              <div className='rounded-3xl border border-slate-200 bg-slate-50 p-4'>
                <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
                  Why report?
                </p>
                <p className='mt-2 text-sm leading-6 text-slate-700'>
                  {reasonMeta.detail}
                </p>
              </div>

              <div>
                <label className='mb-2 block text-sm font-semibold text-slate-900'>
                  Reason
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100'>
                  {REASONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='mb-2 block text-sm font-semibold text-slate-900'>
                  Short description <span className='text-rose-500'>*</span>
                </label>
                <input
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  required
                  placeholder='Add a short summary'
                  className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100'
                />
                <p className='mt-1 text-xs text-slate-500'>
                  Required. Give a brief summary of the issue.
                </p>
              </div>

              <div>
                <label className='mb-2 block text-sm font-semibold text-slate-900'>
                  Details <span className='text-rose-500'>*</span>
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={5}
                  required
                  placeholder='Tell us what happened and where possible include timestamps, messages, or context.'
                  className='w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100'
                />
                <div className='mt-1 flex items-center justify-between gap-3 text-xs'>
                  <p className='text-slate-500'>
                    Required. Minimum {MIN_DETAILS_LENGTH} characters.
                  </p>
                  <p
                    className={
                      detailsText.length >= MIN_DETAILS_LENGTH
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }>
                    {detailsText.length}/{MIN_DETAILS_LENGTH}
                  </p>
                </div>
              </div>

              <div>
                <label className='mb-2 block text-sm font-semibold text-slate-900'>
                  Proof <span className='text-rose-500'>*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime'
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) return;
                    const isVideo = file.type.startsWith("video/");
                    const limit = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
                    if (
                      ![
                        "image/jpeg",
                        "image/png",
                        "image/webp",
                        "video/mp4",
                        "video/webm",
                        "video/quicktime",
                      ].includes(file.type)
                    ) {
                      setError(
                        "Proof must be a JPG, PNG, WEBP, MP4, WEBM, or MOV file.",
                      );
                      e.target.value = "";
                      return;
                    }
                    if (file.size > limit) {
                      setError(
                        `That file is too large. Max ${isVideo ? "20MB" : "5MB"} for ${isVideo ? "videos" : "images"}.`,
                      );
                      e.target.value = "";
                      return;
                    }
                    setError("");
                    setProof(file);
                  }}
                  className='hidden'
                />
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='group flex flex-col w-full items-stretch overflow-hidden rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 text-left transition hover:border-sky-300 hover:bg-sky-50/40'>
                  <div className='flex w-full items-center gap-4 p-4'>
                    <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200'>
                      <svg
                        className='h-6 w-6 text-slate-500'
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
                    </div>

                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-semibold text-slate-900'>
                        Click to add one required proof file
                      </p>
                      <p className='mt-1 text-xs leading-6 text-slate-500'>
                        Image: JPG, PNG, WEBP up to 5MB. Video: MP4, WEBM, MOV
                        up to 20MB.
                      </p>
                    </div>
                    {/* <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">Upload</span> */}
                  </div>
                  <div className='px-4 pb-4 flex items-center justify-end'>
                    <span className='w-30 rounded-full text-center bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200'>
                      Upload
                    </span>
                  </div>
                </button>
                {proof && (
                  <div className='mt-3 rounded-2xl border border-slate-200 bg-white p-3'>
                    <div className='flex items-center justify-between gap-3'>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-semibold text-slate-900'>
                          {proof.name}
                        </p>
                        <p className='text-xs text-slate-500'>
                          {Math.max(
                            1,
                            Math.round((proof.size / (1024 * 1024)) * 10) / 10,
                          )}
                          MB · {proof.type}
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={() => setProof(null)}
                        className='rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600'>
                        Remove
                      </button>
                    </div>
                    {proofPreview && proof.type.startsWith("image/") && (
                      <img
                        src={proofPreview}
                        alt='Proof preview'
                        className='mt-3 h-40 w-full rounded-2xl object-cover'
                      />
                    )}
                  </div>
                )}
              </div>

              <div className='rounded-3xl border border-amber-200 bg-amber-50 p-4'>
                <p className='text-sm font-semibold text-amber-900'>
                  Reporter identity is recorded
                </p>
                <p className='mt-1 text-sm leading-6 text-amber-800'>
                  Admins will see who submitted this report so moderation stays
                  accountable. False or abusive reporting may itself be
                  reviewed.
                </p>
              </div>

              {error && (
                <p className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
                  {error}
                </p>
              )}

              <button
                onClick={() => void handleSubmit()}
                disabled={!canSubmit}
                className='w-full rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(59,130,246,0.25)] disabled:opacity-60'>
                {submitting || uploading ? "Submitting..." : "Submit report"}
              </button>
            </>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
