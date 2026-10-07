"use client";

import { VerificationWarning } from "@/components/verification/VerificationWarning";
import { useAuth } from "@/hooks/useAuth";
import { friendlyApiError, friendlyApiMessage } from "@/lib/apiMessages";
import { getProtectedRouteDecision } from "@/lib/routeAccess";
import { Camera, LoaderCircle, UserRoundCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function VerificationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [readinessState, setReadinessState] = useState<
    "checking" | "ready" | "warming" | "unavailable"
  >("checking");
  const [serviceStatus, setServiceStatus] = useState<string | null>(
    "Checking verification service...",
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<string | null>(null);
  const [showSample, setShowSample] = useState(false);
  const routeDecision =
    !loading && user
      ? getProtectedRouteDecision("/verification", user)
      : null;
  const redirectTo = routeDecision?.redirectTo ?? null;
  const shouldHoldForRedirect = Boolean(redirectTo && redirectTo !== pathname);

  const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

  useIsomorphicLayoutEffect(() => {
    if (loading || !routeDecision?.redirectTo) return;
    router.replace(routeDecision.redirectTo);
  }, [loading, routeDecision?.redirectTo, router]);

  useEffect(() => {
    if (loading || !user || user.verificationStatus === "approved") return;

    const controller = new AbortController();

    const warm = async () => {
      try {
        const res = await fetch(
          `${API}/api/verification/readiness/faceverify`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const data = await res.json().catch(() => ({}));

        if (controller.signal.aborted) return;

        if (res.ok) {
          setReadinessState("ready");
          setServiceStatus(null);
          return;
        }

        const state = data.state === "warming" ? "warming" : "unavailable";
        setReadinessState(state);
        setServiceStatus(
          state === "warming"
            ? "Verification service is starting up. Please try again in a moment."
            : "Verification service is temporarily unavailable.",
        );
      } catch {
        if (controller.signal.aborted) return;
        setReadinessState("unavailable");
        setServiceStatus("Verification service is temporarily unavailable.");
      }
    };

    void warm();

    return () => {
      controller.abort();
    };
  }, [API, loading, user]);

  const fullName = user?.name?.trim() ?? "";
  const displayName = fullName.split(" ")[0] || "there";

  if (loading || !user || shouldHoldForRedirect) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(180deg,_#F8FBFF_0%,_#EEF4FF_100%)] px-4'>
        <div className='rounded-[2rem] border border-white/70 bg-white/90 px-6 py-5 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent' />
        </div>
      </div>
    );
  }

  const handleStartVerification = async () => {
    if (!fullName) {
      setErrorMessage("Your full name is required.");
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    setStatusCode(null);

    try {
      if (readinessState === "checking") {
        const readiness = await fetch(
          `${API}/api/verification/readiness/faceverify`,
          {
            method: "GET",
            cache: "no-store",
          },
        ).catch(() => null);
        if (!readiness) {
          setStatusMessage(null);
          setReadinessState("unavailable");
          setServiceStatus("Verification service is temporarily unavailable.");
          setErrorMessage(
            "Verification service is temporarily unavailable. Please try again in a moment.",
          );
          return;
        }
        const data = await readiness.json().catch(() => ({}));
        if (!readiness.ok) {
          setReadinessState(
            data.state === "warming" ? "warming" : "unavailable",
          );
          setServiceStatus(
            data.state === "warming"
              ? "Verification service is starting up. Please try again shortly."
              : "Verification service is temporarily unavailable.",
          );
          setErrorMessage(
            data.state === "warming"
              ? "Verification service is starting up. Please wait a moment and try again."
              : "Verification service is temporarily unavailable right now.",
          );
          return;
        }
        setReadinessState("ready");
        setServiceStatus(null);
      }

      const res = await fetch(`${API}/api/verification/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
        },
        body: JSON.stringify({ full_name: fullName }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusCode(data.code || null);
        if (data.code === "FACEVERIFY_STARTING_UP") {
          setReadinessState("warming");
          setServiceStatus(
            "Verification service is starting up. Please try again shortly.",
          );
        }
        const base = friendlyApiMessage(
          data.message,
          "We couldn't start verification right now.",
        );
        const detail = data.code
          ? ` ${friendlyApiMessage(data.code, "")}`
          : data.error
            ? ` ${friendlyApiMessage(data.error, "")}`
            : "";
        throw new Error(`${base}${detail}`.trim());
      }

      if (data.status === "verification_required" && data.verifyUrl) {
        setStatusMessage("Redirecting you to FaceVerify...");
        window.location.assign(data.verifyUrl);
        return;
      }

      if (data.status === "manual_review_pending") {
        router.replace("/verification/review");
        return;
      }

      setStatusMessage(
        friendlyApiMessage(data.message, "Verification started."),
      );
      setStatusCode(data.code || null);
    } catch (err) {
      setErrorMessage(
        friendlyApiError(err, "We couldn't submit verification right now."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(180deg,_#F8FBFF_0%,_#EEF4FF_100%)] px-4 py-8 lg:px-6 lg:py-12'>
      <div className='mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center'>
        <aside className='hidden self-start rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur lg:flex lg:flex-col lg:justify-between'>
          <div>
            <h1 className='max-w-md text-4xl font-black tracking-tight text-[#0F172A]'>
              FaceVerify keeps the platform clean and trustworthy.
            </h1>
            <p className='mt-4 max-w-lg text-sm leading-7 text-slate-600'>
              Tap once to start the live check. FaceVerify guides the capture
              and sends the result back automatically.
            </p>
          </div>

          <div className='space-y-4 mt-3'>
            {[
              {
                icon: <Camera />,
                title: "Start the live camera check",
                text: "FaceVerify opens a guided flow with automatic capture.",
              },
              {
                icon: <UserRoundCheck />,
                title: "Be yourself on camera",
                text: "Point your own camera at your face; not a photo, screen, or printout.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className='rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xs'>
                <div className='mb-1 flex items-center gap-3'>
                  <span className='text-[#3251a5]'>{item.icon}</span>
                  <p className='text-sm font-semibold text-[#0F172A]'>
                    {item.title}
                  </p>
                </div>

                <p className='mt-1 text-sm leading-6 text-slate-600'>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </aside>

        <section className='rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8'>
          <div className='mb-8 text-center lg:text-left'>
            <h1 className='mb-2 text-3xl font-bold text-[#0F172A]'>
              Final verification, {displayName}
            </h1>
            <p className='text-[#64748B]'>
              Start the live verification flow to confirm your identity.
            </p>
            <div className='mt-4 flex flex-wrap justify-center gap-2 lg:justify-start'>
              {[
                "Live camera only",
                "No photos or screenshots",
                "Fully automatic",
              ].map((pill) => (
                <span
                  key={pill}
                  className='rounded-full border border-[#DBEAFE] bg-[#c8e0ff] px-3 py-1 text-xs font-semibold text-[#1d336e]'>
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className='mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'>
              <p>{errorMessage}</p>
            </div>
          )}

          <div className='space-y-5'>
            {/* {serviceStatus && (
              <div className='rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'>
                {serviceStatus}
              </div>
            )} */}
            <div className='rounded-2xl border border-[#DBEAFE] bg-[#F8FBFF] px-4 py-4'>
              <p className='text-sm font-semibold text-[#0F172A]'>
                How it works
              </p>
              <p className='mt-1 text-sm leading-7 text-[#64748B]'>
                FaceVerify opens a guided camera flow on its own. You don&apos;t
                upload anything during verification.
              </p>
            </div>
            <VerificationWarning />
          </div>

          <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
            <button
              type='button'
              onClick={() => void handleStartVerification()}
              disabled={submitting}
              className='w-full rounded-xl bg-[#1E3A8A] py-4 font-semibold text-white transition hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50'>
              {submitting
                ? "Starting liveness verification..."
                : "Start liveness verification"}
            </button>
            <button
              type='button'
              onClick={() => setShowSample(true)}
              className='w-full rounded-xl border border-[#CBD5E1] bg-white py-4 font-semibold text-[#334155] transition hover:bg-slate-50'>
              See sample
            </button>
          </div>
        </section>
      </div>

      {submitting && (
        <div className='fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-md'>
          <div className='rounded-[2rem] border border-white/20 bg-white/95 px-6 py-5 text-center shadow-[0_28px_70px_rgba(15,23,42,0.18)]'>
            <div className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF]'>
              <LoaderCircle className='h-7 w-7 animate-spin text-[#1E3A8A]' />
            </div>
            <p className='text-sm font-semibold text-[#0F172A]'>
              Starting your liveness verification...
            </p>
            <p className='mt-1 text-xs leading-6 text-[#64748B]'>
              Please wait while we open FaceVerify and prepare your session.
            </p>
          </div>
        </div>
      )}

      {showSample && (
        <div className='fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 px-4 py-4 backdrop-blur-sm sm:items-center'>
          <div className='max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.2)]'>
            <div className='flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[#94A3B8]'>
                  Photo sample
                </p>
                <h2 className='mt-1 text-xl font-bold text-[#0F172A]'>
                  Clear selfie and image position
                </h2>
              </div>
              <button
                type='button'
                onClick={() => setShowSample(false)}
                className='rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#64748B] transition hover:border-slate-300 hover:text-[#0F172A]'>
                Close
              </button>
            </div>

            <div className='grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center'>
              <div className='rounded-[1.75rem] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_42%),linear-gradient(180deg,_#F8FBFF_0%,_#EDF4FF_100%)] p-5'>
                <div className='relative mx-auto aspect-[4/5] max-w-xs overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-[0_24px_50px_rgba(30,58,138,0.12)]'>
                  <img
                    src='/uploads/verification_img_sample.webp'
                    alt='Sample Selfie'
                    className='h-full w-full rounded-xl object-cover'
                  />
                  <div className='absolute inset-x-0 bottom-4 px-4'>
                    <div className='rounded-2xl bg-[#0F172A]/88 px-4 py-3 text-center text-xs font-medium text-white shadow-lg'>
                      Keep your face in the middle of the frame
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-5'>
                <div>
                  <h3 className='text-lg font-bold text-[#0F172A]'>
                    What a clear selfie should look like
                  </h3>
                  <p className='mt-2 text-sm leading-7 text-[#64748B]'>
                    Use the example below as a guide before you start the
                    verification flow.
                  </p>
                </div>

                <div className='space-y-3'>
                  {[
                    "Face centered in the frame",
                    "Good lighting, no shadows or glare",
                    "Face visible, background clear",
                    "No sunglasses, masks, or hats",
                  ].map((tip) => (
                    <div
                      key={tip}
                      className='flex items-start gap-3 rounded-2xl border border-slate-100 bg-[#F8FAFF] px-4 py-3.5 text-sm text-[#334155]'>
                      <span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-xs font-bold text-[#1D4ED8]'>
                        ✓
                      </span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
