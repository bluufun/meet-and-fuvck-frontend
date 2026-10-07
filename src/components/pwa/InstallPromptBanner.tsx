"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { Download, Share, X } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const emptySubscribe = () => () => {};

export default function InstallPromptBanner() {
  const { canPromptAndroid, canPromptIOS, promptInstall, dismiss } =
    usePwaInstall();
  // Starts false on both server and client so the very first client render
  // matches the server-rendered (null) output — avoiding a hydration
  // mismatch — then flips true right after mount. No artificial delay:
  // this fires as soon as React commits, not after a fixed wait.

  const ready = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!ready || (!canPromptAndroid && !canPromptIOS)) {
    return null;
  }

  if (!ready || (!canPromptAndroid && !canPromptIOS)) return null;

  return (
    <div
      className='fixed inset-x-0 bottom-0 z-[60] px-3'
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
      }}>
      <div className='mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-slate-200'>
        <Image
          src='/icons/icon-192.png'
          alt='Bluufun'
          width={44}
          height={44}
          className='h-11 w-11 shrink-0 rounded-xl ring-1 ring-slate-200'
        />

        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-bold text-slate-900'>
            Install Bluufun App
          </p>
          {canPromptAndroid ? (
            <p className='truncate text-xs text-slate-500'>
              Install for quicker access.
            </p>
          ) : (
            // Laid out as two explicit steps (flex rows, not text flowing
            // around an inline icon) so the reading order can never get
            // scrambled by how the browser wraps things on a narrow screen.
            <div className='mt-0.5 flex flex-col gap-0.5 text-xs text-slate-500'>
              <span className='flex items-center gap-1.5'>
                <span className='flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500'>
                  1
                </span>
                <span className='flex items-center gap-1'>
                  Tap
                  <Share className='h-3.5 w-3.5 shrink-0' />
                  in Safari
                </span>
              </span>
              <span className='flex items-center gap-1.5'>
                <span className='flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500'>
                  2
                </span>
                Tap &ldquo;Add to Home Screen&rdquo;
              </span>
            </div>
          )}
        </div>

        {canPromptAndroid && (
          <button
            onClick={promptInstall}
            className='flex items-center gap-2 shrink-0 rounded-full bg-orange-500 px-4 py-2 text-xs font-bold text-white active:bg-violet-700'>
            <Download className='w-5 h-5 stroke-3' /> Install
          </button>
        )}

        <button
          onClick={dismiss}
          aria-label='Dismiss'
          className='shrink-0 rounded-full p-1.5 text-slate-400 active:bg-slate-100'>
          <X className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
}
