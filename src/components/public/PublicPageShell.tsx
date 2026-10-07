"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import MobileMenuPanel from "@/components/landing/MobileMenuPanel";

export default function PublicPageShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className='min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_34%),linear-gradient(180deg,_#F8FBFF_0%,_#EEF4FF_100%)] pt-[96px] text-slate-900'>
      <nav className='fixed left-0 max-w-4xl mx-auto right-0 top-0 z-50 px-4 py-4'>
        <div className='flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-md'>
          <Link href='/' className='flex items-center gap-3'>
            <BrandLogo width={110} height={36} priority />
          </Link>

          <button
            type='button'
            onClick={() => setMenuOpen(true)}
            aria-label='Open menu'
            className='flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-navyblue-600 transition hover:bg-white/25'>
            <Menu className='h-4 w-4' />
          </button>
        </div>
      </nav>

      <div className='mx-auto flex min-h-[calc(100vh-6rem)] max-w-2xl flex-col px-4'>
        <section className='border border-white/70 bg-white/80 p-5 backdrop-blur-md sm:p-7'>
          <p className='text-xs font-semibold uppercase tracking-[0.32em] text-blue-600'>
            {eyebrow}
          </p>
          <h1 className='mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl'>
            {title}
          </h1>
          <p className='mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base'>
            {subtitle}
          </p>

          <div className='mt-6 space-y-4'>{children}</div>
        </section>
      </div>

      <MobileMenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
    </main>
  );
}
