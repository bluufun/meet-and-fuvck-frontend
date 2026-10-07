"use client";

import { useState } from "react";
import Link from "next/link";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { Menu, ArrowRight, Check, Lock } from "lucide-react";
import {
  BadgeCheck,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import MobileMenuPanel from "@/components/landing/MobileMenuPanel";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-plex-mono",
});

const serif = { fontFamily: "var(--font-dm-sans)" };
const mono = { fontFamily: "var(--font-plex-mono)" };

const NAV_LINKS = [
  { label: "Discover", href: "/discover" },
  { label: "About", href: "/about-us" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const STORY_POINTS = [
  {
    num: "01",
    title: "Real profiles, real intent",
    text: "Bluufun helps adults present who they are, what they enjoy, and the kind of connection they want, without the noise.",
    icon: UserRound,
  },
  {
    num: "02",
    title: "Verification-first trust",
    text: "Identity checks, selfie verification, and moderation tools keep the experience safer, clearer, and more credible.",
    icon: BadgeCheck,
  },
  {
    num: "03",
    title: "Built for a premium flow",
    text: "Every screen, from sign-up to support, is designed so the experience feels elegant and effortless throughout.",
    icon: Sparkles,
  },
];

const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Create your account",
    text: "Sign up, complete the basics, and build a profile that reflects your lifestyle and energy.",
    icon: UserRound,
  },
  {
    num: "02",
    title: "Verify when required",
    text: "Complete selfie and liveness checks so trust stays high across the platform.",
    icon: ShieldCheck,
  },
  {
    num: "03",
    title: "Add your media",
    text: "Upload photos and videos within plan limits to give your profile more presence.",
    icon: HeartHandshake,
  },
  {
    num: "04",
    title: "Use coins & boosts",
    text: "Coins power paid actions, while boosts increase visibility and profile reach.",
    icon: Wallet,
  },
];

const WHY_IT_MATTERS = [
  "Bluufun is an 18+ platform, so every experience is shaped with adult users and adult expectations in mind.",
  "Funmates and seekers have distinct roles, which keeps discovery, monetization, and profile management easy to understand.",
  "The dashboard keeps verification, media, activation, and wallet actions close together instead of scattered across the app.",
  "Support, FAQ, Terms, and Privacy pages are built into the product, so help is never more than a tap away.",
];

const MANIFESTO = [
  {
    label: "Mission",
    text: "To redefine how modern adults discover and build exciting social connections, with authenticity and quality first.",
    accent: false,
  },
  {
    label: "Vision",
    text: "To become Africa's leading premium social discovery platform for confident, open-minded people.",
    accent: true,
  },
  {
    label: "Promise",
    text: "Everyone deserves to meet people who genuinely match their vibe, on a platform where respect is the standard.",
    accent: false,
  },
];

export default function AboutUsPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className={`${dmSans.variable} ${plexMono.variable} bg-[#faf9f6] text-[#12152a]`}>
      {/* NAV */}
      <header className='sticky top-0 z-50 border-b border-slate-950/10 bg-[#faf9f6]/80 backdrop-blur-md'>
        <nav className='mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8'>
          <Link href='/' className='flex items-center gap-2'>
            <BrandLogo width={110} height={36} priority />
          </Link>

          <div className='hidden items-center gap-8 text-sm text-slate-500 md:flex'>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition hover:text-[#12152a] ${
                  link.href === "/about-us"
                    ? "font-semibold text-[#12152a]"
                    : ""
                }`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className='flex items-center gap-3'>
            <Link
              href='/register'
              className='hidden rounded-full bg-gradient-to-r from-[#ef3f63] to-[#ff8a4c] px-5 py-2.5 text-sm font-semibold text-[#1a0a0e] shadow-[0_8px_24px_-8px_rgba(239,63,99,0.6)] sm:inline-flex'>
              Join Bluufun
            </Link>
            <button
              type='button'
              onClick={() => setMenuOpen(true)}
              aria-label='Open menu'
              className='flex h-10 w-10 items-center justify-center rounded-full border border-slate-950/10 text-slate-600 md:hidden'>
              <Menu className='h-[18px] w-[18px]' />
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className='overflow-hidden px-4 pb-16 pt-16 sm:px-10 md:px-22 sm:pt-24'>
          <div className='mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]'>
            <div>
              <span
                style={mono}
                className='inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#ef3f63] '>
                Our story
              </span>
              <h1
                style={serif}
                className='mt-5 text-[38px] font-medium leading-[1.06] tracking-tight sm:text-[52px] lg:text-[62px]'>
                Chemistry,{" "}
                <em className='bg-gradient-to-r from-[#ef3f63] to-[#ff8a4c] bg-clip-text font-medium text-transparent'>
                  verified.
                </em>
                <br />
                Connection, simplified.
              </h1>
              <p className='mt-5 max-w-md text-[17px] leading-7 text-slate-500'>
                Bluufun is a premium social discovery platform for adults who
                want genuine chemistry, clear intent, and a smoother way to meet
                people who match their energy.
              </p>

              <div className='mt-8 flex flex-wrap items-center gap-6'>
                <Link
                  href='/register'
                  className='inline-flex items-center gap-2.5 rounded-full bg-[#12152a] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(18,21,42,0.35)] transition hover:-translate-y-0.5'>
                  Get started
                  <ArrowRight className='h-3.5 w-3.5' />
                </Link>
                <a
                  href='#how-it-works'
                  className='border-b border-slate-950/15 pb-0.5 text-sm font-semibold text-[#12152a]'>
                  See how it works
                </a>
              </div>

              <div className='mt-11 flex flex-wrap gap-9'>
                {[
                  { big: "18+", small: "Adults only, by design" },
                  { big: "2 roles", small: "Funmates & seekers" },
                  { big: "1 goal", small: "Real, matched intent" },
                ].map((stat) => (
                  <div key={stat.small}>
                    <b
                      style={serif}
                      className='block bg-gradient-to-r from-[#12152a] to-slate-400 bg-clip-text text-[28px] font-medium text-transparent'>
                      {stat.big}
                    </b>
                    <span
                      style={mono}
                      className='text-[10.5px] uppercase tracking-[0.08em] text-slate-400'>
                      {stat.small}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* hero graphic: duo-ring + verified profile cards */}
            <div className='relative mx-auto h-[360px] w-full max-w-sm sm:h-[440px]'>
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='absolute h-[300px] w-[300px] rounded-full border border-slate-950/10 sm:h-[380px] sm:w-[380px]' />
                <div className='absolute h-[230px] w-[230px] animate-[spin_60s_linear_infinite] rounded-full border border-dashed border-slate-950/10 opacity-60 sm:h-[290px] sm:w-[290px]' />
                <div className='absolute left-2 top-14 h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle_at_32%_32%,#8fb0ff,#3b64ff_65%,transparent_80%)] opacity-50 blur-[46px] sm:h-[260px] sm:w-[260px]' />
                <div className='absolute right-0 top-24 h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle_at_68%_32%,#ffc59a,#ef3f63_65%,transparent_80%)] opacity-50 blur-[46px] sm:h-[260px] sm:w-[260px]' />
              </div>

              <div className='absolute left-0 top-2 w-[150px] -rotate-6 rounded-2xl border border-slate-950/10 bg-white/90 p-3.5 shadow-[0_24px_44px_-22px_rgba(18,21,42,0.28)] backdrop-blur-md sm:w-[172px]'>
                <div className='relative mb-2.5 h-20 overflow-hidden rounded-[10px] bg-gradient-to-br from-[#eef1fb] to-[#faf1ec] sm:h-24'>
                  <img
                    src='/uploads/verification_img_sample.webp'
                    alt='Sample Selfie'
                    className='h-full w-full rounded-xl object-cover'
                  />
                </div>
                <div className='flex items-center gap-1.5 text-[12.5px] font-semibold'>
                  Amaka, 26
                  <span className='flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ef3f63] to-[#ff8a4c]'>
                    <Check className='h-2 w-2 stroke-[4] text-[#1a0a0e]' />
                  </span>
                </div>
                <div className='mt-0.5 text-[10.5px] text-slate-400'>
                  Verified &middot; Lagos
                </div>
              </div>

              <div className='absolute bottom-8 right-0 w-[150px] rotate-[5deg] rounded-2xl border border-slate-950/10 bg-white/90 p-3.5 shadow-[0_24px_44px_-22px_rgba(18,21,42,0.28)] backdrop-blur-md sm:w-[172px]'>
                <div className='relative mb-2.5 h-20 overflow-hidden rounded-[10px] bg-gradient-to-br from-[#eef1fb] to-[#faf1ec] sm:h-24'>
                  <img
                    src='/uploads/zee.jpg'
                    alt='Sample Selfie'
                    className='h-full w-full rounded-xl object-cover object-left'
                  />
                </div>
                <div className='flex items-center gap-1.5 text-[12.5px] font-semibold'>
                  Zainab, 29
                  <span className='flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#ef3f63] to-[#ff8a4c]'>
                    <Check className='h-2 w-2 stroke-[4] text-[#1a0a0e]' />
                  </span>
                </div>
                <div className='mt-0.5 text-[10.5px] text-slate-400'>
                  Verified &middot; Abuja
                </div>
              </div>

              <div
                style={mono}
                className='absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#12152a] px-4 py-2.5 text-[11px] font-semibold text-white shadow-[0_16px_34px_-16px_rgba(18,21,42,0.4)]'>
                <Lock className='h-3 w-3' />
                Numbers stay private until unlocked
              </div>
            </div>
          </div>
        </section>

        {/* STORY POINTS */}
        <section className='border-t border-slate-950/10 px-5 py-16 sm:px-8 md:px-22 sm:py-24'>
          <div className='mx-auto max-w-6xl'>
            <div className='max-w-xl'>
              <span
                style={mono}
                className='inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#092072]'>
                What we&apos;re building
              </span>
              <h2
                style={serif}
                className='mt-4 text-[28px] font-medium leading-tight sm:text-[36px]'>
                A platform shaped around real actions, not endless swiping.
              </h2>
              <p className='mt-3.5 text-[15px] leading-7 text-slate-500'>
                Onboarding, discovery, wallets, boosts, and media management are
                organized so everything feels simple, intentional, and worth
                trusting.
              </p>
            </div>

            <div className='mt-12 grid gap-5 sm:grid-cols-3'>
              {STORY_POINTS.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className='rounded-[18px] border border-slate-950/10 bg-white p-7 shadow-[0_18px_34px_-26px_rgba(18,21,42,0.22)]'>
                    <span
                      style={serif}
                      className='text-sm italic text-slate-400'>
                      {item.num}
                    </span>

                    <h3 className='text-[17px] font-semibold'>{item.title}</h3>
                    <p className='mt-2.5 text-sm leading-6 text-slate-500'>
                      {item.text}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id='how-it-works'
          className='border-t border-slate-950/10 px-5 py-16 sm:px-8 md:px-22 sm:py-24'>
          <div className='mx-auto max-w-6xl'>
            <div className='max-w-xl'>
              <span
                style={mono}
                className='inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#ef3f63] '>
                How it works
              </span>
              <h2
                style={serif}
                className='mt-4 text-[28px] font-medium leading-tight sm:text-[36px]'>
                The Bluufun flow, start to finish.
              </h2>
              <p className='mt-3.5 text-[15px] leading-7 text-slate-500'>
                Four steps take you from sign-up to a profile that&apos;s ready
                to be discovered.
              </p>
            </div>

            <div className='mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-slate-950/10'>
              {HOW_IT_WORKS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className='lg:px-6 lg:first:pl-0 lg:last:pr-0'>
                    <span
                      style={serif}
                      className='text-[56px] font-medium leading-none text-transparent [-webkit-text-stroke:1.4px_rgba(18,21,42,0.16)]'>
                      {item.num}
                    </span>

                    <h3 className='mt-4 text-[15.5px] font-semibold'>
                      {item.title}
                    </h3>
                    <p className='mt-2 text-[13.5px] leading-6 text-slate-500'>
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* WHY IT MATTERS */}
        <section className='border-t border-slate-950/10 px-5 py-16 sm:px-8 md:px-22 sm:py-24'>
          <div className='mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-16'>
            <div>
              <span
                style={mono}
                className='inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#0e226d]'>
                Why it matters
              </span>
              <h2
                style={serif}
                className='mt-4 text-[28px] font-medium leading-tight sm:text-[34px]'>
                Built for trust and clarity, at every layer.
              </h2>
              <p className='mt-3.5 max-w-md text-[15px] leading-7 text-slate-500'>
                Bluufun is an 18+ platform, and every decision, from role
                structure to dashboard layout, is shaped with adult users and
                adult expectations in mind.
              </p>
            </div>

            <div className='border-l border-slate-950/10 pl-8 sm:pl-10'>
              {WHY_IT_MATTERS.map((item, index) => (
                <div
                  key={item}
                  className={`flex gap-4 py-5 ${
                    index !== WHY_IT_MATTERS.length - 1
                      ? "border-b border-slate-950/10"
                      : ""
                  } ${index === 0 ? "pt-0" : ""}`}>
                  <span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-r from-[#ef3f63] to-[#ff8a4c]'>
                    <Check className='h-3 w-3 stroke-[3.2] text-[#1a0a0e]' />
                  </span>
                  <p className='text-sm leading-6 text-slate-500'>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MANIFESTO: mission / vision / promise */}
        <section className='border-t border-slate-950/10 px-5 py-16 sm:px-8 sm:py-20'>
          <div className='mx-auto max-w-6xl'>
            <div className='grid gap-px overflow-hidden rounded-[28px] border border-slate-950/10 bg-slate-950/10 sm:grid-cols-3'>
              {MANIFESTO.map((item) => (
                <div key={item.label} className='bg-[#f2f0ea] p-9'>
                  <span
                    style={mono}
                    className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-400'>
                    {item.label}
                  </span>
                  <p
                    style={serif}
                    className={`mt-[18px] text-[19px] italic leading-snug ${
                      item.accent
                        ? "bg-gradient-to-r from-[#ef3f63] to-[#ff8a4c] bg-clip-text text-transparent"
                        : ""
                    }`}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className='relative overflow-hidden px-5 py-24 text-center sm:py-28'>
          <div className='pointer-events-none absolute inset-x-0 bottom-0 h-full bg-[radial-gradient(60%_100%_at_50%_100%,rgba(74,125,255,0.16),transparent_70%)]' />
          <div className='relative mx-auto flex max-w-lg flex-col items-center'>
            <div className='relative mb-6 h-[34px] w-16'>
              <span className='absolute left-0 top-0 h-[34px] w-[34px] rounded-full bg-gradient-to-br from-[#6f9bff] to-[#3b64ff]' />
              <span className='absolute right-0 top-0 h-[34px] w-[34px] rounded-full bg-gradient-to-br from-[#ef3f63] to-[#ff8a4c] mix-blend-multiply' />
            </div>
            <h2
              style={serif}
              className='text-[34px] font-medium leading-tight sm:text-[52px]'>
              Explore. Connect. Enjoy.
            </h2>
            <p className='mt-4 max-w-sm text-[15.5px] leading-7 text-slate-500'>
              Because life is better when you explore it with the right people.
            </p>
            <Link
              href='/register'
              className='mt-8 inline-flex items-center gap-2.5 rounded-full bg-[#12152a] px-8 py-4 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(18,21,42,0.35)] transition hover:-translate-y-0.5'>
              Join Bluufun
              <ArrowRight className='h-3.5 w-3.5' />
            </Link>
          </div>
        </section>
      </main>

      <footer className='border-t border-slate-950/10 px-5 py-9 sm:px-8'>
        <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-slate-400 sm:flex-row'>
          <span>
            &copy; {new Date().getFullYear()} Bluufun. All rights reserved.
          </span>
          <div className='flex gap-6'>
            <Link href='/terms' className='hover:text-[#12152a]'>
              Terms
            </Link>
            <Link href='/privacy' className='hover:text-[#12152a]'>
              Privacy
            </Link>
            <Link href='/contact' className='hover:text-[#12152a]'>
              Support
            </Link>
          </div>
        </div>
      </footer>

      <MobileMenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
