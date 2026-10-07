"use client";

import { useState } from "react";
import Link from "next/link";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { Menu, ArrowRight, ChevronDown } from "lucide-react";
import { Lock, ShieldCheck, UserCheck, Settings2 } from "lucide-react";
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
    title: "We never sell data",
    text: "Your personal information is used to run Bluufun, not sold to third parties for profit.",
    icon: Lock,
  },
  {
    num: "02",
    title: "18+ only",
    text: "Bluufun is built for adults, and accounts found to belong to minors are removed.",
    icon: UserCheck,
  },
  {
    num: "03",
    title: "You stay in control",
    text: "Access, correct, or delete your information, subject to limited legal and safety exceptions.",
    icon: Settings2,
  },
  {
    num: "04",
    title: "Security by design",
    text: "Reasonable technical and organizational measures help keep your information protected.",
    icon: ShieldCheck,
  },
];

type Section = {
  title: string;
  body: string[];
};

type Group = {
  label: string;
  items: Section[];
};

const PRIVACY_GROUPS: Group[] = [
  {
    label: "What we collect",
    items: [
      {
        title: "1. Introduction",
        body: [
          "Bluufun is a social discovery platform that helps users create profiles, verify identities, browse other users, and manage contact unlocks, boosts, coins, and related account features.",
          "This Privacy Policy explains what information we collect, how we use it, how we share it, and the choices you have when using Bluufun.",
          "By using Bluufun, you acknowledge that you have read this Privacy Policy and understand how your information is handled.",
        ],
      },
      {
        title: "2. Information We Collect",
        body: [
          "Account information such as your name, email address, phone number, date of birth, gender, username, and similar registration details.",
          "Profile information such as your bio, photos, videos, preferences, and other content you choose to add to your profile.",
          "Verification data such as selfie images, liveness verification results, and related review information used for identity checks.",
          "Payment information such as transaction references and payment status. Payment card details are handled by our payment processor and are not stored by Bluufun unless expressly stated in a specific flow.",
          "Device and usage information such as IP address, browser type, device details, pages visited, and interaction data used to keep the service working properly.",
        ],
      },
    ],
  },
  {
    label: "How we use it",
    items: [
      {
        title: "3. How We Use Your Information",
        body: [
          "We use your information to create and manage your account.",
          "We use verification data to confirm identity and support account trust and safety.",
          "We use payment and transaction information to process coins, boosts, subscriptions, and other paid actions.",
          "We use profile information to display accounts and help users discover each other on the platform.",
          "We use usage data to improve the platform, detect fraud or abuse, communicate important updates, and comply with legal obligations.",
        ],
      },
      {
        title: "4. How We Share Information",
        body: [
          "We may share information with payment providers, identity verification providers, cloud hosting providers, analytics providers, and law enforcement or regulators when required by law.",
          "We may also share information when needed to operate Bluufun, process requests, prevent abuse, or protect the rights and safety of users and the platform.",
          "We do not sell users' personal information.",
        ],
      },
    ],
  },
  {
    label: "Your control",
    items: [
      {
        title: "5. Data Retention",
        body: [
          "We retain information while your account is active.",
          "After account deletion, we may keep certain information for a reasonable period where required by law, for fraud prevention, for security, or to resolve disputes.",
          "When information is no longer needed, we securely delete it or anonymize it where appropriate.",
        ],
      },
      {
        title: "6. User Rights",
        body: [
          "Depending on your location and applicable law, you may request access to your data, update your information, request correction of inaccurate information, delete your account, or contact us about privacy concerns.",
          "Some requests may be limited where we need to keep information for legal, fraud prevention, security, or dispute resolution purposes.",
        ],
      },
      {
        title: "7. Data Security",
        body: [
          "We use reasonable technical and organizational measures designed to protect personal information.",
          "No online platform can guarantee absolute security, so you should also protect your account credentials and use Bluufun carefully.",
        ],
      },
    ],
  },
  {
    label: "Other",
    items: [
      {
        title: "8. Children's Privacy",
        body: [
          "Bluufun is only for users aged 18 years and older.",
          "If we find that an account belongs to a minor, we may remove or disable the account and take appropriate protective steps.",
        ],
      },
      {
        title: "9. Changes to This Privacy Policy",
        body: [
          "We may update this Privacy Policy from time to time to reflect product, legal, or operational changes.",
          "Continued use of Bluufun after an update becomes effective means you accept the updated Privacy Policy.",
        ],
      },
      {
        title: "10. Contact Us",
        body: [
          "Support email: support@bluufun.com",
          "Business contact information: use the Contact Us page in the app for the latest support routes and contact options.",
        ],
      },
    ],
  },
];

const SECTION_COUNT = PRIVACY_GROUPS.reduce(
  (sum, group) => sum + group.items.length,
  0,
);

export default function PrivacyPage() {
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
                className='transition hover:text-[#12152a]'>
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
              Legal
            </span>
            <h1
              style={serif}
              className='mt-5 text-[38px] font-medium leading-[1.06] tracking-tight sm:text-[52px]'>
              Privacy,{" "}
              <em className='bg-gradient-to-r from-[#ef3f63] to-[#ff8a4c] bg-clip-text font-medium text-transparent'>
                respected.
              </em>
            </h1>
            <p className='mx-auto mt-5 max-w-xl text-[17px] leading-7 text-slate-500'>
              This Privacy Policy explains how Bluufun collects, uses, shares,
              retains, and protects your information.
            </p>

            <div className='mt-8 flex flex-wrap items-center justify-center gap-6'>
              <a
                href='#privacy'
                className='inline-flex items-center gap-2.5 rounded-full bg-[#12152a] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(18,21,42,0.35)] transition hover:-translate-y-0.5'>
                Read the policy
                <ArrowRight className='h-3.5 w-3.5' />
              </a>
              <Link
                href='/terms'
                className='border-b border-slate-950/15 pb-0.5 text-sm font-semibold text-[#12152a]'>
                View terms of use
              </Link>
            </div>

            <div className='mt-12 flex flex-wrap items-center justify-center gap-10'>
              {[
                { big: String(SECTION_COUNT), small: "Sections" },
                { big: String(PRIVACY_GROUPS.length), small: "Topic groups" },
                { big: "18+", small: "Adults only" },
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
        <section className='border-t border-slate-950/10 px-5 py-16 sm:px-8 md:px-22 sm:py-24'>
          <div className='mx-auto max-w-6xl'>
            <div className='max-w-xl'>
              <span
                style={mono}
                className='inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#0e2166]'>
                The essentials
              </span>
              <h2
                style={serif}
                className='mt-4 text-[28px] font-medium leading-tight sm:text-[36px]'>
                A few things worth knowing up front.
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

        {/* PRIVACY ACCORDION */}
        <section
          id='privacy'
          className='border-t border-slate-950/10 px-5 py-16 sm:px-8 sm:py-24'>
          <div className='mx-auto max-w-3xl'>
            <div className='text-center'>
              <span
                style={mono}
                className='inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#ef3f63] before:h-px before:w-5 before:bg-current before:opacity-60 after:h-px after:w-5 after:bg-current after:opacity-60'>
                Full policy
              </span>
              <h2
                style={serif}
                className='mt-4 text-[28px] font-medium leading-tight sm:text-[36px]'>
                Every section, organized by topic.
              </h2>
            </div>

            <div className='mt-12 space-y-12'>
              {PRIVACY_GROUPS.map((group) => (
                <div key={group.label}>
                  <p
                    style={mono}
                    className='mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400'>
                    {group.label}
                  </p>
                  <div className='divide-y divide-slate-950/10 rounded-[18px] border border-slate-950/10 bg-white shadow-[0_18px_34px_-26px_rgba(18,21,42,0.22)]'>
                    {group.items.map((item) => (
                      <details key={item.title} className='group px-6 py-1'>
                        <summary className='flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[15px] font-semibold'>
                          <span>{item.title}</span>
                          <ChevronDown className='h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 group-open:text-[#ef3f63]' />
                        </summary>
                        <div className='space-y-3 pb-5 pr-8'>
                          {item.body.map((paragraph) => (
                            <p
                              key={paragraph}
                              className='text-[14.5px] leading-7 text-slate-500'>
                              {paragraph}
                            </p>
                          ))}
                        </div>
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
              Questions about your data?
            </h2>
            <p className='mt-4 max-w-sm text-[15.5px] leading-7 text-slate-500'>
              Reach out and our support team will help clarify anything that
              isn&apos;t covered here.
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
            <Link href='/faq' className='hover:text-[#12152a]'>
              FAQ
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