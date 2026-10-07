"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Hand,
  UserRound,
  X,
  GalleryHorizontal,
} from "lucide-react";

const STORAGE_KEY = "bluufun_landingTourSeen";

type TourStep = {
  title: string;
  body: string;
  position: string;
  icon: typeof Hand;
  accent: string;
};

const STEPS: TourStep[] = [
  {
    title: "Swipe up",
    body: "Move to the next funmate in the feed.",
    position: "right-4 top-1/2 -translate-y-1/2",
    icon: ArrowUp,
    accent: "from-blue-500/90 to-cyan-400/90",
  },
  {
    title: "Swipe down",
    body: "Go back to the previous funmate.",
    position: "right-4 top-[58%] -translate-y-1/2",
    icon: ArrowDown,
    accent: "from-slate-700/90 to-slate-900/90",
  },
  {
    title: "Swipe left",
    body: "Change to the next media in this profile.",
    position: "left-4 top-[58%] -translate-y-1/2",
    icon: ArrowLeft,
    accent: "from-violet-500/90 to-fuchsia-500/90",
  },
  {
    title: "Tap username",
    body: "Open the full profile page for this funmate.",
    position: "left-1/2 bottom-[92px] -translate-x-1/2",
    icon: UserRound,
    accent: "from-emerald-500/90 to-teal-400/90",
  },
  {
    title: "More media",
    body: "These markers show when more media is available.",
    position: "left-1/2 top-[72px] -translate-x-1/2",
    icon: GalleryHorizontal,
    accent: "from-amber-500/90 to-orange-500/90",
  },
];

export default function LandingTourGuide() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === "1") {
      return;
    }

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, "1");
      setVisible(true);
      setStep(0);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (step >= STEPS.length) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setStep((current) => current + 1);
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [step, visible]);

  if (!visible || step >= STEPS.length) {
    return null;
  }

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className='pointer-events-none fixed inset-0 z-40 xl:hidden'>
      <div className='absolute inset-0 bg-slate-950/8 backdrop-blur-[1px]' />

      <div className={`absolute ${current.position}`}>
        <div className='relative'>
          <div className='absolute inset-0 -z-10 rounded-full bg-blue-500/20 blur-xl' />

          <div className='flex flex-col items-center gap-3'>
            <div
              className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${current.accent} shadow-[0_18px_50px_rgba(15,23,42,0.25)] ring-1 ring-white/20`}>
              <div className='absolute -inset-4 rounded-full bg-white/15 animate-ping' />
              <div className='absolute -inset-2 rounded-full bg-white/12' />
              <Icon className='relative z-10 h-7 w-7 text-white drop-shadow' />
            </div>

            <div className='max-w-[220px] rounded-[1.4rem] border border-white/15 bg-slate-950/70 px-4 py-3 text-center shadow-[0_20px_60px_rgba(15,23,42,0.35)] backdrop-blur-md'>
              <p className='text-sm font-bold text-white'>{current.title}</p>
              <p className='mt-1 text-xs leading-6 text-white/78'>
                {current.body}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='pointer-events-auto absolute right-4 top-4'>
        <button
          type='button'
          onClick={() => setVisible(false)}
          className='inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/65 px-3 text-[11px] font-semibold text-white shadow-lg shadow-black/15 backdrop-blur-md transition hover:bg-slate-950/80'>
          <X className='h-3.5 w-3.5' />
          Skip tour
        </button>
      </div>

      <div className='pointer-events-none absolute bottom-[calc(60px+env(safe-area-inset-bottom)+12px)] left-1/2 -translate-x-1/2'>
        <div className='flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/60 px-3 py-1.5 text-[10px] font-semibold text-white/80 backdrop-blur-md'>
          <span>{step + 1}</span>
          <span className='h-1 w-1 rounded-full bg-white/45' />
          <span>{STEPS.length}</span>
        </div>
      </div>
    </div>
  );
}
