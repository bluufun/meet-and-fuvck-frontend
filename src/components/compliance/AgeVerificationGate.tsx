"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import BrandLogo from "@/components/BrandLogo";

const AGE_VERIFIED_KEY = "bf_age_verified";

const AGE_VERIFIED_EVENT = "bf_age_verified_changed";

function hasStoredVerification() {
  try {
    return window.localStorage.getItem(AGE_VERIFIED_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AgeVerificationGate() {
  const [hydrated, setHydrated] = useState(false);
  const isVerified = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(AGE_VERIFIED_EVENT, onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(AGE_VERIFIED_EVENT, onStoreChange);
      };
    },
    hasStoredVerification,
    () => false,
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  const state = !hydrated ? "checking" : isVerified ? "verified" : "required";

  useEffect(() => {
    if (state !== "required") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [state]);

  function confirmAge() {
    try {
      window.localStorage.setItem(AGE_VERIFIED_KEY, "1");
    } catch {
      // If storage is unavailable, the approval still applies for this render.
    }
    window.dispatchEvent(new Event(AGE_VERIFIED_EVENT));
  }

  if (state !== "required") return null;

  return (
    <div
      className='fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-y-auto bg-white  py-8 sm:px-6'
      role='dialog'
      aria-modal='true'
      aria-labelledby='age-gate-title'
      aria-describedby='age-gate-description'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#bed5f2] blur-2xl' />
        <div className='absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-white/12 blur-3xl' />
        <div className='absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent' />
      </div>

      <section className='relative w-full md:max-w-lg overflow-hidden border border-white/15 bg-white '>
        <div className='bg-gradient-to-br from-[#EFF6FF] via-white to-[#FFF7ED] px-6 pb-6 pt-5 text-center sm:px-10 sm:pt-10'>
          <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white ring-2 ring-slate-200'>
            <span className='text-2xl font-black tracking-[-0.08em] text-[#1E3A8A]'>
              18+
            </span>
          </div>

          <div className='mt-6 flex justify-center'>
            <BrandLogo width={150} height={42} priority />
          </div>

          <p className='mt-6 text-[11px] font-bold uppercase tracking-[0.28em] text-[#1E3A8A]'>
            Adults only
          </p>
          <h1
            id='age-gate-title'
            className='mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl'>
            Welcome to Bluufun
          </h1>
          <p
            id='age-gate-description'
            className='mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600 sm:text-base'>
            Bluufun is intended for adults aged 18 and over. Please confirm your
            age before entering the site.
          </p>
        </div>

        <div className='px-6 pb-7 pt-6 sm:px-10 sm:pb-9'>
          <button
            type='button'
            onClick={confirmAge}
            className='w-full rounded-2xl bg-[#1E3A8A] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1E3A8A]/20 transition hover:bg-[#172E70] focus:outline-none focus:ring-4 focus:ring-[#93C5FD] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 sm:py-4'>
            I’m over 18
          </button>

          <p className='mt-5 text-center text-xs leading-5 text-slate-500'>
            By entering Bluufun, you confirm that you are at least 18 years old
            and agree to our{" "}
            <Link
              href='/terms'
              target='_blank'
              rel='noreferrer'
              className='font-semibold text-[#1E3A8A] underline decoration-[#BFDBFE] underline-offset-2 hover:text-[#172E70]'>
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link
              href='/privacy'
              target='_blank'
              rel='noreferrer'
              className='font-semibold text-[#1E3A8A] underline decoration-[#BFDBFE] underline-offset-2 hover:text-[#172E70]'>
              Privacy Policy
            </Link>
            .
          </p>

          <a
            href='https://www.google.com'
            className='mt-6 block text-center text-xs font-semibold text-slate-400 underline underline-offset-2 transition hover:text-slate-600'>
            Exit Here
          </a>
        </div>
      </section>
    </div>
  );
}
