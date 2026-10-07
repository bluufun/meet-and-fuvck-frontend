"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { friendlyApiMessage } from "@/lib/apiMessages";
import Image from "next/image";
import { getProtectedRouteDecision } from "@/lib/routeAccess";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type GenderChoice = "male" | "female" | null;

export default function OnboardingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, setUser } = useAuth();
  const [selectedGender, setSelectedGender] = useState<GenderChoice>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const routeDecision =
    !loading && user
      ? getProtectedRouteDecision("/onboarding", user)
      : null;
  const redirectTo = routeDecision?.redirectTo ?? null;
  const shouldHoldForRedirect = Boolean(redirectTo && redirectTo !== pathname);

  const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

  useIsomorphicLayoutEffect(() => {
    if (loading || !routeDecision?.redirectTo) return;
    router.replace(routeDecision.redirectTo);
  }, [loading, routeDecision?.redirectTo, router]);

  if (loading || (!user && !error) || shouldHoldForRedirect) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(180deg,_#F8FBFF_0%,_#EEF4FF_100%)] px-4'>
        <div className='rounded-[2rem] border border-white/70 bg-white/90 px-6 py-5 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent' />
        </div>
      </div>
    );
  }

  async function handleContinue() {
    if (!selectedGender) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/users/me/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
        },
        body: JSON.stringify({ gender: selectedGender }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          friendlyApiMessage(
            data?.message,
            "We couldn't save your choice right now.",
          ),
        );
      }

      if (data?.user) {
        setUser(data.user);
      }

      const next =
        data?.redirectTo ||
        (selectedGender === "male" ? "/dashboard" : "/onboarding/funmate");
      router.replace(next);
    } catch (err) {
      setError(
        friendlyApiMessage(err, "We couldn't save your choice right now."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className='min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_34%),linear-gradient(180deg,_#F8FBFF_0%,_#EEF4FF_100%)] px-4 py-8 lg:px-6 lg:py-12'>
      <div className='mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center'>
        <aside className='hidden lg:flex flex-col justify-between self-start rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur'>
          <div>
            <h1 className='mt-8 max-w-md text-4xl font-black tracking-tight text-[#0F172A]'>
              A small choice now makes the rest of the journey cleaner.
            </h1>
            <p className='mt-4 max-w-lg text-sm leading-7 text-slate-600'>
              Pick the option that matches how you want to use Bluufun.
              We&apos;ll route you to the right next step without making you
              repeat work.
            </p>
          </div>

          <div className='space-y-3 pt-2'>
            {[
              {
                title: "Male = seeker",
                text: "You can start connecting and browsing beautiful funmates right away.",
              },
              {
                title: "Female = funmate",
                text: "You'll continue into the funmate setup so you can finish your profile properly.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className='rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm'>
                <p className='font-semibold text-[#0F172A]'>{item.title}</p>
                <p className='mt-1 leading-6 text-slate-600'>{item.text}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className='rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8'>
          <div className='mb-8 text-center lg:text-left'>
            <h1 className='mb-2 text-[28px] font-bold text-[#0F172A]'>
              Hey {firstName}, select your path
            </h1>
            <p className='mx-auto max-w-sm text-sm leading-relaxed text-[#64748B] lg:mx-0 lg:max-w-xl'>
              Choose the option that fits you best. Male continues as seeker,
              female continues as funmate.
            </p>
            <div className='mt-4 flex flex-wrap justify-center gap-2 lg:justify-start'>
              {[
                "Personalized next step",
                "No extra detours",
                "Clean routing",
              ].map((pill) => (
                <span
                  key={pill}
                  className='rounded-full border border-[#DBEAFE] bg-[#F8FBFF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]'>
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className='mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'>
              {error}
            </div>
          )}

          <div className='mb-8 space-y-4'>
            <button
              onClick={() => setSelectedGender("male")}
              className={`group w-full rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                selectedGender === "male"
                  ? "border-[#1E3A8A] bg-[#EFF6FF] shadow-sm shadow-[#1E3A8A]/10"
                  : "border-[#E2E8F0] bg-white hover:border-[#93C5FD] hover:bg-[#F8FBFF]"
              }`}>
              <div className='flex items-start gap-4'>
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-colors ${
                    selectedGender === "male"
                      ? "bg-[#1E3A8A]/10"
                      : "bg-[#F1F5F9] group-hover:bg-[#EFF6FF]"
                  }`}>
                  <Image
                    src='/uploads/guy-icon.svg'
                    alt='Boy icon'
                    width={60}
                    height={60}
                  />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                    <h3 className='text-base font-semibold text-[#0F172A]'>
                      Male
                    </h3>
                    {selectedGender === "male" && (
                      <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A]'>
                        <svg
                          width='10'
                          height='8'
                          viewBox='0 0 10 8'
                          fill='none'>
                          <path
                            d='M1 4L3.5 6.5L9 1'
                            stroke='white'
                            strokeWidth='1.8'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className='text-sm leading-relaxed text-[#64748B]'>
                    Continue as a seeker and go straight to browsing for
                    funmates.
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedGender("female")}
              className={`group w-full rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                selectedGender === "female"
                  ? "border-[#3B82F6] bg-[#EFF6FF] shadow-sm shadow-[#3B82F6]/10"
                  : "border-[#E2E8F0] bg-white hover:border-[#93C5FD] hover:bg-[#F8FBFF]"
              }`}>
              <div className='flex items-start gap-4'>
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl transition-colors ${
                    selectedGender === "female"
                      ? "bg-[#3B82F6]/15"
                      : "bg-[#F1F5F9] group-hover:bg-[#EFF6FF]"
                  }`}>
                  <Image
                    src='/uploads/girl-icon.png'
                    alt='Girl icon'
                    width={160}
                    height={160}
                  />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                    <h3 className='text-base font-semibold text-[#0F172A]'>
                      Female
                    </h3>
                    {selectedGender === "female" && (
                      <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]'>
                        <svg
                          width='10'
                          height='8'
                          viewBox='0 0 10 8'
                          fill='none'>
                          <path
                            d='M1 4L3.5 6.5L9 1'
                            stroke='white'
                            strokeWidth='1.8'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className='text-sm leading-relaxed text-[#64748B]'>
                    Continue as a funmate and proceed to the profile onboarding.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedGender || submitting}
            className='w-full rounded-xl bg-[#1E3A8A] py-3.5 text-sm font-semibold text-white shadow-sm shadow-[#1E3A8A]/30 transition-all duration-150 hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-40'>
            {submitting ? (
              <span className='flex items-center justify-center gap-2'>
                <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                Just a sec...
              </span>
            ) : selectedGender === "male" ? (
              "Continue as a seeker →"
            ) : selectedGender === "female" ? (
              "Continue as a funmate →"
            ) : (
              "Choose an option to continue"
            )}
          </button>
        </section>
      </div>
    </div>
  );
}
