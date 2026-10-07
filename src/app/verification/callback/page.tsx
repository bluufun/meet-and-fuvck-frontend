"use client";

export const dynamic = "force-dynamic";

import { useAuth } from "@/hooks/useAuth";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { friendlyApiMessage, friendlyApiError } from "@/lib/apiMessages";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type SessionResult = {
  status?: "pending" | "verified" | "failed" | "manual_review_pending";
  message?: string;
};

type StatusState =
  | "loading"
  | "verified"
  | "pending"
  | "review"
  | "failed"
  | "error";

const STATUS_COPY: Record<
  StatusState,
  { title: string; eyebrow: string; body: string }
> = {
  loading: {
    eyebrow: "Checking session",
    title: "Confirming your liveness check",
    body: "We’re checking your FaceVerify session right now. This usually takes just a moment.",
  },
  verified: {
    eyebrow: "Success",
    title: "Verification approved",
    body: "Your identity has been confirmed and your account is ready to use.",
  },
  pending: {
    eyebrow: "Still processing",
    title: "Verification is still being reviewed",
    body: "FaceVerify has not finalized the session yet. You can check again, or go to the review page if your account is waiting on manual review.",
  },
  review: {
    eyebrow: "Under review",
    title: "Your verification is awaiting admin review",
    body: "FaceVerify completed successfully and your account is now waiting for a moderator to confirm it.",
  },
  failed: {
    eyebrow: "Verification not accepted",
    title: "We couldn’t complete this verification",
    body: "Restart the process with a clear live selfie. Use your real face, good lighting, and no AI-modified image.",
  },
  error: {
    eyebrow: "Something went wrong",
    title: "We couldn’t confirm the session",
    body: "The callback link could not be confirmed right now. You can try again or restart verification.",
  },
};

function StateIcon({ state }: { state: StatusState }) {
  if (state === "verified") {
    return <ShieldCheck className='h-8 w-8 text-emerald-600 sm:h-10 sm:w-10' />;
  }

  if (state === "loading") {
    return (
      <LoaderCircle className='h-8 w-8 animate-spin text-[#1E3A8A] sm:h-10 sm:w-10' />
    );
  }

  if (state === "pending") {
    return <Sparkles className='h-8 w-8 text-[#1D4ED8] sm:h-10 sm:w-10' />;
  }

  if (state === "review") {
    return <Sparkles className='h-8 w-8 text-[#1D4ED8] sm:h-10 sm:w-10' />;
  }

  return <AlertCircle className='h-8 w-8 text-rose-600 sm:h-10 sm:w-10' />;
}

function Panel({
  eyebrow,
  title,
  body,
  icon,
  accent,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className='w-full rounded-[2rem] border border-white/70 bg-white/90 p-6 text-center shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8'>
      <div
        className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${accent} sm:mb-6 sm:h-20 sm:w-20 sm:rounded-3xl`}>
        {icon}
      </div>

      <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[#94A3B8]'>
        {eyebrow}
      </p>
      <h1 className='mt-2 text-2xl font-bold leading-tight text-[#0F172A] sm:text-3xl'>
        {title}
      </h1>
      <p className='mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#64748B] sm:text-base'>
        {body}
      </p>

      {children}
    </div>
  );
}

function VerificationCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading: authLoading } = useAuth();
  const [state, setState] = useState<StatusState>("loading");
  const [message, setMessage] = useState(STATUS_COPY.loading.body);
  const [attempt, setAttempt] = useState(0);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const token = searchParams.get("token")?.trim();
    if (!token) {
      setState("error");
      setMessage("Missing verification token.");
      return;
    }

    const controller = new AbortController();
    let redirectTimer: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      try {
        const res = await fetch(
          `${API}/api/verification/session/${encodeURIComponent(token)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
            },
            signal: controller.signal,
          },
        );

        const data = (await res.json().catch(() => ({}))) as SessionResult;
        if (!res.ok) {
          throw new Error(
            friendlyApiMessage(
              data.message,
              "We couldn't confirm that verification yet.",
            ),
          );
        }

        if (data.status === "verified") {
          setState("verified");
          setMessage(
            friendlyApiMessage(data.message, "Your account is verified."),
          );
          setRedirecting(true);
          redirectTimer = setTimeout(() => router.replace("/dashboard"), 1800);
          return;
        }

        if (data.status === "pending") {
          setState("pending");
          setMessage(
            friendlyApiMessage(
              data.message,
              "Verification is still being processed.",
            ),
          );
          return;
        }

        if (data.status === "manual_review_pending") {
          setState("review");
          setMessage(
            friendlyApiMessage(
              data.message,
              "FaceVerify completed successfully. Your account is waiting for admin review.",
            ),
          );
          return;
        }

        setState("failed");
        setMessage(friendlyApiMessage(data.message, "Verification failed."));
      } catch (error) {
        if (controller.signal.aborted) return;
        setState("error");
        setMessage(
          friendlyApiError(error, "We couldn't confirm verification."),
        );
      }
    };

    void run();
    return () => {
      controller.abort();
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [authLoading, router, searchParams, attempt]);

  const copy = STATUS_COPY[state];

  return (
    <div className='relative overflow-hidden px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-8'>
      <div className='relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center mt-20'>
        {state === "loading" && (
          <Panel
            eyebrow={copy.eyebrow}
            title={copy.title}
            body={message}
            icon={
              <LoaderCircle className='h-8 w-8 animate-spin text-[#1E3A8A] sm:h-10 sm:w-10' />
            }
            accent='bg-slate-100'>
            <div className='mt-8 rounded-2xl border border-[#DBEAFE] bg-[#F8FBFF] px-4 py-4 text-left'>
              <p className='text-sm font-semibold text-[#0F172A]'>
                What happens next
              </p>
              <p className='mt-1 text-sm leading-7 text-[#64748B]'>
                We&apos;re checking the FaceVerify session and will move you
                straight to the right next step once it resolves.
              </p>
            </div>
          </Panel>
        )}

        {state === "verified" && (
          <Panel
            eyebrow={copy.eyebrow}
            title={copy.title}
            body={message}
            icon={
              <CheckCircle2 className='h-8 w-8 text-emerald-600 sm:h-10 sm:w-10' />
            }
            accent='bg-emerald-50'>
            <div className='mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-left text-sm text-emerald-900'>
              <p className='font-semibold'>Next step</p>
              <p className='mt-1 leading-7'>
                {redirecting
                  ? "Taking you to your dashboard now."
                  : "You’re approved. You can continue to the dashboard right away."}
              </p>
            </div>

            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <button
                onClick={() => router.replace("/dashboard")}
                className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af] sm:w-auto sm:px-8 sm:py-3.5'>
                Go to dashboard
                <ArrowRight className='h-4 w-4' />
              </button>
            </div>
          </Panel>
        )}

        {(state === "pending" || state === "review") && (
          <Panel
            eyebrow={copy.eyebrow}
            title={copy.title}
            body={message}
            icon={
              <Sparkles className='h-8 w-8 text-[#1D4ED8] sm:h-10 sm:w-10' />
            }
            accent='bg-[#EFF6FF]'>
            <div className='mt-8 grid gap-3 rounded-2xl border border-[#DBEAFE] bg-[#F8FBFF] px-4 py-4 text-left text-sm text-[#334155] sm:grid-cols-2'>
              <div>
                <p className='font-semibold text-[#0F172A]'>
                  {state === "review"
                    ? "Manual review"
                    : "If this is manual review"}
                </p>
                <p className='mt-1 leading-7'>
                  {state === "review"
                    ? "Your account is already queued for admin approval."
                    : "Your verification is with the moderation team and will update automatically."}
                </p>
              </div>
              <div>
                <p className='font-semibold text-[#0F172A]'>
                  If it is still processing
                </p>
                <p className='mt-1 leading-7'>
                  Give it a moment, then check again if needed.
                </p>
              </div>
            </div>

            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <button
                onClick={() => setAttempt((v) => v + 1)}
                className='inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-6 py-3 text-sm font-semibold text-[#1D4ED8] transition hover:bg-[#DBEAFE] sm:w-auto sm:px-8 sm:py-3.5'>
                <RotateCcw className='h-4 w-4' />
                Check again
              </button>
              <button
                onClick={() => router.push("/verification/review")}
                className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af] sm:w-auto sm:px-8 sm:py-3.5'>
                Go to review page
                <ArrowRight className='h-4 w-4' />
              </button>
            </div>
          </Panel>
        )}

        {state === "failed" && (
          <Panel
            eyebrow={copy.eyebrow}
            title={copy.title}
            body={message}
            icon={
              <TriangleAlert className='h-8 w-8 text-rose-600 sm:h-10 sm:w-10' />
            }
            accent='bg-rose-50'>
            <div className='mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-left text-sm text-rose-900'>
              <p className='font-semibold'>
                Try again with a clearer live check
              </p>
              <p className='mt-1 leading-7'>
                Start a fresh live verification, make sure your face is fully
                visible, and avoid AI edits or filters.
              </p>
            </div>

            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <button
                onClick={() => router.push("/verification")}
                className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af] sm:w-auto sm:px-8 sm:py-3.5'>
                Restart verification
                <ArrowRight className='h-4 w-4' />
              </button>
              <button
                onClick={() => router.push("/contact")}
                className='inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-6 py-3 text-sm font-semibold text-[#334155] transition hover:bg-slate-50 sm:w-auto sm:px-8 sm:py-3.5'>
                Contact support
              </button>
            </div>
          </Panel>
        )}

        {state === "error" && (
          <Panel
            eyebrow={copy.eyebrow}
            title={copy.title}
            body={message}
            icon={
              <AlertCircle className='h-8 w-8 text-rose-600 sm:h-10 sm:w-10' />
            }
            accent='bg-rose-50'>
            <div className='mt-8 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left'>
              <p className='text-sm font-semibold text-[#0F172A]'>
                Recovery options
              </p>
              <ul className='mt-2 space-y-2 text-sm leading-7 text-[#64748B]'>
                <li>• Re-open the verification page and try again.</li>
                <li>
                  • If the link looks wrong or expired, start a fresh
                  verification.
                </li>
                <li>• Contact support if the issue keeps repeating.</li>
              </ul>
            </div>

            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <button
                onClick={() => setAttempt((v) => v + 1)}
                className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1e40af] sm:w-auto sm:px-8 sm:py-3.5'>
                Try again
                <RotateCcw className='h-4 w-4' />
              </button>
              <button
                onClick={() => router.push("/verification")}
                className='inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-6 py-3 text-sm font-semibold text-[#334155] transition hover:bg-slate-50 sm:w-auto sm:px-8 sm:py-3.5'>
                Back to verification
              </button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

export default function VerificationCallbackPage() {
  return (
    <Suspense fallback={<div className='min-h-screen bg-white' />}>
      <VerificationCallbackInner />
    </Suspense>
  );
}
