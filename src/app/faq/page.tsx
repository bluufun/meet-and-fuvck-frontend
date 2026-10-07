"use client";

import { useState } from "react";
import Link from "next/link";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { Menu, ArrowRight, ChevronDown } from "lucide-react";
import { CreditCard, ShieldCheck, Sparkles, UserRound } from "lucide-react";
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

const HIGHLIGHTS = [
  {
    num: "01",
    title: "Fast discovery",
    text: "Browse profiles with a clean, swipe-friendly mobile experience.",
    icon: Sparkles,
  },
  {
    num: "02",
    title: "Privacy-first",
    text: "We keep safety and data handling visible, not hidden away.",
    icon: ShieldCheck,
  },
  {
    num: "03",
    title: "Simple payments",
    text: "Earn and wallet actions stay easy to find when you need them.",
    icon: CreditCard,
  },
  {
    num: "04",
    title: "Profile clarity",
    text: "Your dashboard gives you a clear place to manage your identity.",
    icon: UserRound,
  },
];

const FAQ_GROUPS = [
  {
    label: "Getting started",
    items: [
      {
        q: "What is Bluufun?",
        a: "Bluufun helps people discover nearby funmates, connect faster, and keep the experience light, social, and intentional.",
      },
      {
        q: "Is Bluufun free?",
        a: "Browsing and core discovery are free. Certain boost, wallet, and premium actions may be paid depending on what you choose to use.",
      },
      {
        q: "How do I get verified?",
        a: "Go to your dashboard or profile area, complete the required verification steps, and wait for review.",
      },
      {
        q: "Why am I being sent to verification or onboarding?",
        a: "Some actions are only available after your account is complete and your email or identity checks are approved. That keeps the platform safer and makes your profile more visible.",
      },
    ],
  },
  {
    label: "Profile & media",
    items: [
      {
        q: "Can I edit my profile after sign up?",
        a: "Yes. You can update your profile details, appearance fields, and vibe bio from the dashboard at any time.",
      },
      {
        q: "How does media upload work?",
        a: "You can upload photos and videos from your profile gallery or onboarding flow. Each plan has its own photo and video quota, and files are checked for size before upload.",
      },
      {
        q: "What are the media size limits?",
        a: "Images can be up to 5MB each and videos can be up to 20MB each.",
      },
      {
        q: "Can I change my media later?",
        a: "Yes. You can add, remove, or replace profile media from the dashboard whenever your current plan allows it.",
      },
    ],
  },
  {
    label: "Boosts & wallet",
    items: [
      {
        q: "What do the boost plans change?",
        a: "Boost plans increase your media allowance and unlock more profile capacity. The exact photo and video counts depend on your plan tier.",
      },
      {
        q: "How does the wallet work?",
        a: "Your wallet is where you manage coin balance, top-ups, and withdrawals. It is designed to keep payments easy to find from the dashboard.",
      },
      {
        q: "How do I report a problem or ask for help?",
        a: "Use the contact page or support routes in the app if something feels off. If a verification, payment, or upload issue happens, include as much detail as possible so it can be reviewed faster.",
      },
    ],
  },
];

const FAQ_COUNT = FAQ_GROUPS.reduce(
  (sum, group) => sum + group.items.length,
  0,
);

export default function FAQPage() {
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
                  link.href === "/faq" ? "font-semibold text-[#12152a]" : ""
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
        <section className='overflow-hidden px-5 pb-16 pt-16 sm:px-8 sm:pt-24'>
          <div className='mx-auto max-w-3xl text-center'>
            <span
              style={mono}
              className='inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#ef3f63] before:h-px before:w-5 before:bg-current before:opacity-60 after:h-px after:w-5 after:bg-current after:opacity-60'>
              Help center
            </span>
            <h1
              style={serif}
              className='mt-5 text-[38px] font-medium leading-[1.06] tracking-tight sm:text-[52px]'>
              Answers,{" "}
              <em className='bg-gradient-to-r from-[#ef3f63] to-[#ff8a4c] bg-clip-text font-medium text-transparent'>
                clarified.
              </em>
            </h1>
            <p className='mx-auto mt-5 max-w-xl text-[17px] leading-7 text-slate-500'>
              A quick, polished place for common questions so you can get
              clarity without leaving the app feeling.
            </p>

            <div className='mt-8 flex flex-wrap items-center justify-center gap-6'>
              <a
                href='#faqs'
                className='inline-flex items-center gap-2.5 rounded-full bg-[#12152a] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(18,21,42,0.35)] transition hover:-translate-y-0.5'>
                Browse questions
                <ArrowRight className='h-3.5 w-3.5' />
              </a>
              <Link
                href='/contact'
                className='border-b border-slate-950/15 pb-0.5 text-sm font-semibold text-[#12152a]'>
                Still need help?
              </Link>
            </div>

            <div className='mt-12 flex flex-wrap items-center justify-center gap-10'>
              {[
                { big: String(FAQ_COUNT), small: "Common questions" },
                { big: String(FAQ_GROUPS.length), small: "Topic groups" },
                { big: "24/7", small: "Self-serve access" },
              ].map((stat) => (
                <div key={stat.small} className='text-center'>
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
        </section>

        {/* HIGHLIGHTS */}
        <section className='border-t border-slate-950/10 px-5 py-16 sm:px-8 sm:py-24'>
          <div className='mx-auto max-w-6xl'>
            <div className='max-w-xl'>
              <span
                style={mono}
                className='inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#0e2166]'>
                Why people stay
              </span>
              <h2
                style={serif}
                className='mt-4 text-[28px] font-medium leading-tight sm:text-[36px]'>
                Built to feel simple, even when questions come up.
              </h2>
            </div>

            <div className='mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4'>
              {HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className='rounded-[18px] border border-slate-950/10 bg-white p-6 shadow-[0_18px_34px_-26px_rgba(18,21,42,0.22)]'>
                    <span
                      style={serif}
                      className='text-sm italic text-slate-400'>
                      {item.num}
                    </span>

                    <h3 className='text-[15.5px] font-semibold'>
                      {item.title}
                    </h3>
                    <p className='mt-2 text-[13.5px] leading-6 text-slate-500'>
                      {item.text}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section
          id='faqs'
          className='border-t border-slate-950/10 px-5 py-16 sm:px-8 sm:py-24'>
          <div className='mx-auto max-w-3xl'>
            <div className='text-center'>
              <span
                style={mono}
                className='inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#ef3f63] before:h-px before:w-5 before:bg-current before:opacity-60 after:h-px after:w-5 after:bg-current after:opacity-60'>
                Questions
              </span>
              <h2
                style={serif}
                className='mt-4 text-[28px] font-medium leading-tight sm:text-[36px]'>
                Everything you might be wondering.
              </h2>
            </div>

            <div className='mt-12 space-y-12'>
              {FAQ_GROUPS.map((group) => (
                <div key={group.label}>
                  <p
                    style={mono}
                    className='mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400'>
                    {group.label}
                  </p>
                  <div className='divide-y divide-slate-950/10 rounded-[18px] border border-slate-950/10 bg-white shadow-[0_18px_34px_-26px_rgba(18,21,42,0.22)]'>
                    {group.items.map((item) => (
                      <details key={item.q} className='group px-6 py-1'>
                        <summary className='flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold'>
                          <span>{item.q}</span>
                          <ChevronDown className='h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 group-open:text-[#ef3f63]' />
                        </summary>
                        <p className='pb-5 pr-8 text-[14.5px] leading-7 text-slate-500'>
                          {item.a}
                        </p>
                      </details>
                    ))}
                  </div>
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
              className='text-[34px] font-medium leading-tight sm:text-[48px]'>
              Still have a question?
            </h2>
            <p className='mt-4 max-w-sm text-[15.5px] leading-7 text-slate-500'>
              If something isn&apos;t covered here, our support team is a
              message away.
            </p>
            <Link
              href='/contact'
              className='mt-8 inline-flex items-center gap-2.5 rounded-full bg-[#12152a] px-8 py-4 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(18,21,42,0.35)] transition hover:-translate-y-0.5'>
              Contact support
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
