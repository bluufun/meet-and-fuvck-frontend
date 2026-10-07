"use client";

import { useState } from "react";
import Link from "next/link";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { Menu, ArrowRight, ChevronDown } from "lucide-react";
import { Scale, ShieldCheck, Wallet, UserCheck } from "lucide-react";
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
    title: "18+ only",
    text: "Bluufun is built exclusively for adults, and eligibility is required to use any part of the platform.",
    icon: UserCheck,
  },
  {
    num: "02",
    title: "Verification-backed",
    text: "Selfie and liveness checks help keep accounts genuine, though they never guarantee behavior.",
    icon: ShieldCheck,
  },
  {
    num: "03",
    title: "Clear coin rules",
    text: "Coins are non-transferable and purchases are generally final, with pricing that can change over time.",
    icon: Wallet,
  },
  {
    num: "04",
    title: "Fair enforcement",
    text: "Abuse, fraud, and policy violations can lead to warnings, restrictions, or account termination.",
    icon: Scale,
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

const TERM_GROUPS: Group[] = [
  {
    label: "Getting started",
    items: [
      {
        title: "1. Introduction",
        body: [
          "Welcome to Bluufun. These Terms of Use explain the rules that apply when you access or use the Bluufun website, app, and related services.",
          "By creating an account or using Bluufun, you agree to follow these Terms and to comply with all applicable laws and regulations.",
          "To use Bluufun, you must meet the eligibility requirements described below and provide accurate information when the service asks for it.",
        ],
      },
      {
        title: "2. Definitions",
        body: [
          "Bluufun means the platform, website, app, and related services operated under the Bluufun brand.",
          "User means any person who accesses or uses Bluufun.",
          "Provider means a user who offers a profile for discovery on Bluufun. In the product, this role is shown as a funmate.",
          "Seeker means a user who browses profiles, discovers providers, or unlocks contact details on Bluufun.",
          "Coins means the in-app digital credits used for paid actions on Bluufun.",
          "Subscription means a paid plan or boost tier that unlocks specific service features or allowances.",
          "Verification means identity review steps used by Bluufun, including selfie-based verification and related checks.",
          "Content means any photos, videos, profile details, bios, text, or other material that users upload or submit.",
          "Services means the features, tools, and functionality Bluufun makes available from time to time.",
        ],
      },
      {
        title: "3. Eligibility",
        body: [
          "You must be at least 18 years old to use Bluufun.",
          "You must have the legal capacity to enter into a binding contract.",
          "You must not be prohibited from using dating or social discovery services under applicable law.",
          "You must provide accurate, current, and complete information when registering and while using the platform.",
        ],
      },
      {
        title: "4. Account Registration",
        body: [
          "One account is intended for one person only.",
          "You are responsible for keeping your account information accurate and up to date.",
          "You are responsible for protecting your login details and any activity carried out through your account.",
          "You must not share your account with another person or allow another person to use it as if it were their own.",
          "Bluufun may suspend or restrict accounts that appear fraudulent, misused, or inconsistent with these Terms.",
        ],
      },
      {
        title: "5. Identity Verification",
        body: [
          "Bluufun may require selfie verification and liveness checks before certain features become available.",
          "Verification is intended to improve trust and account quality, but it does not guarantee that a user will behave safely or honestly.",
          "Bluufun may approve, reject, pause, revoke, or request repeated verification where needed.",
          "Bluufun may also require re-verification if account details change or if a review is needed for safety or integrity reasons.",
        ],
      },
    ],
  },
  {
    label: "Using Bluufun",
    items: [
      {
        title: "6. Provider Responsibilities",
        body: [
          "Providers agree to upload genuine photos and videos that reflect their own identity.",
          "Providers must not use another person's identity, photos, or misleading profile information.",
          "Providers should keep their profile details accurate, including their WhatsApp number where it is provided on the platform.",
          "Providers are expected to respond respectfully and must not use Bluufun to scam, mislead, or deceive others.",
        ],
      },
      {
        title: "7. Seeker Responsibilities",
        body: [
          "Seekers must treat providers respectfully and must not harass, threaten, or pressure them.",
          "Seekers must not impersonate other users or misuse contact information gained through Bluufun.",
          "Seekers must follow applicable laws when using the platform or contacting other users outside Bluufun.",
          "Seekers must not use Bluufun to collect, store, or reuse contact details for abusive, unlawful, or deceptive purposes.",
        ],
      },
      {
        title: "12. Acceptable Use Policy",
        body: [
          "You must not create fake accounts, impersonate others, spam users, or engage in fraud.",
          "You must not harass, threaten, blackmail, exploit, or shame other users.",
          "You must not use Bluufun for hate speech, sexual exploitation, illegal activity, malware distribution, or copyright infringement.",
          "You must not use Bluufun in a way that misrepresents your identity or the nature of your account.",
        ],
      },
      {
        title: "13. Prohibited Content",
        body: [
          "Bluufun does not allow child exploitation content, non-consensual intimate images, violent content, terrorist content, illegal drug content, weapons sales, fraudulent schemes, or stolen identities.",
          "Bluufun may remove prohibited content and take enforcement action without prior notice where necessary.",
        ],
      },
      {
        title: "14. Safety Disclaimer",
        body: [
          "Bluufun cannot guarantee how any user will behave, and matching or contact access does not guarantee a safe or successful interaction.",
          "Use caution when interacting with others, meet in public places when appropriate, tell someone you trust where you are going, and report suspicious activity.",
        ],
      },
    ],
  },
  {
    label: "Payments & plans",
    items: [
      {
        title: "8. Coins and Payments",
        body: [
          "Coins are digital access credits used for paid actions on Bluufun.",
          "Coins are non-transferable and may only be used within Bluufun as permitted by the platform.",
          "Prices may change from time to time, and Bluufun may update the cost of coins or paid features.",
          "Purchases are generally final and non-refundable except where required by law or where Bluufun states otherwise.",
          "Unlocking a provider's contact details may grant access to that provider's WhatsApp number as shown in the product flow, unless access must later be removed for legal, safety, or enforcement reasons.",
        ],
      },
      {
        title: "9. Provider Subscription Plans",
        body: [
          "Subscription or boost plans may increase profile visibility and media allowances, depending on the tier selected.",
          "Plan benefits, billing, renewal behavior, expiration, and cancellation terms may vary by plan and may be updated from time to time.",
          "If a plan changes, Bluufun may apply the current plan rules shown in the app or on the relevant checkout screen.",
          "Plans may include different allowances for photos and videos, and those limits are enforced by the product and backend logic.",
        ],
      },
      {
        title: "10. Referral Program",
        body: [
          "Bluufun may offer referral rewards to eligible users under the referral program.",
          "Rewards are subject to the conditions shown in the app, including activation requirements where applicable.",
          "Bluufun may withhold, reverse, or cancel referral rewards if fraud, abuse, or policy evasion is suspected.",
          "Only referrals that satisfy the platform's eligibility checks should receive rewards.",
        ],
      },
    ],
  },
  {
    label: "Content & rights",
    items: [
      {
        title: "11. User Content",
        body: [
          "You own the photos, videos, profile information, bios, and other content you submit to Bluufun, subject to any rights you grant or license to the platform.",
          "By uploading Content, you grant Bluufun a limited license to host, display, distribute, and make that Content available as needed to operate the Services.",
          "You are responsible for making sure you have the rights to upload any Content you submit.",
        ],
      },
      {
        title: "16. Intellectual Property",
        body: [
          "Bluufun owns or licenses the trademarks, logo, website, software, design, and branding used to operate the platform.",
          "You may not copy, modify, distribute, or exploit Bluufun intellectual property except as allowed by these Terms or by written permission.",
        ],
      },
      {
        title: "17. Privacy",
        body: [
          "Your use of Bluufun is also governed by our Privacy Policy.",
          "The Privacy Policy explains how data is collected, how verification data is handled, how cookies and analytics may be used, and how communication preferences are managed.",
        ],
      },
    ],
  },
  {
    label: "Enforcement & legal",
    items: [
      {
        title: "15. Reporting and Enforcement",
        body: [
          "Bluufun may investigate reports of abuse, fraud, harassment, or policy violations.",
          "Enforcement actions may include warnings, feature restrictions, suspension, permanent bans, or removal of content or access.",
          "If appeals are offered for a specific action, Bluufun will describe that process in the relevant notice or support flow.",
        ],
      },
      {
        title: "18. Termination",
        body: [
          "Bluufun may suspend or terminate accounts that are involved in fraud, abuse, illegal activity, repeated policy violations, or multiple fake accounts.",
          "Bluufun may also limit access to features or content where needed to protect the platform or other users.",
        ],
      },
      {
        title: "19. Disclaimer of Warranties",
        body: [
          "Bluufun is provided on an as-is and as-available basis.",
          "Bluufun does not guarantee compatibility between users, successful relationships, continuous availability, or error-free operation.",
        ],
      },
      {
        title: "20. Limitation of Liability",
        body: [
          "To the fullest extent permitted by law, Bluufun is not responsible for user disputes, missed opportunities, lost profits, conversations outside Bluufun, third-party services such as WhatsApp, or user-generated content.",
          "Your use of the Services is at your own discretion and risk.",
        ],
      },
      {
        title: "21. Indemnification",
        body: [
          "You agree to indemnify and hold Bluufun harmless from claims, losses, liabilities, or expenses arising from your misuse of the platform, illegal conduct, or violation of these Terms.",
        ],
      },
      {
        title: "22. Changes to the Service",
        body: [
          "Bluufun may modify features, change pricing, add or remove plans, or update policies as the product evolves.",
        ],
      },
      {
        title: "23. Changes to These Terms",
        body: [
          "Bluufun may update these Terms from time to time.",
          "Continued use of the platform after a change becomes effective means you accept the updated Terms.",
        ],
      },
    ],
  },
];

const SECTION_COUNT = TERM_GROUPS.reduce(
  (sum, group) => sum + group.items.length,
  0,
);

export default function TermsPage() {
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
              Terms,{" "}
              <em className='bg-gradient-to-r from-[#ef3f63] to-[#ff8a4c] bg-clip-text font-medium text-transparent'>
                made clear.
              </em>
            </h1>
            <p className='mx-auto mt-5 max-w-xl text-[17px] leading-7 text-slate-500'>
              These Terms describe how Bluufun works, what users can expect, and
              the rules that keep the platform orderly and safer for everyone.
            </p>

            <div className='mt-8 flex flex-wrap items-center justify-center gap-6'>
              <a
                href='#terms'
                className='inline-flex items-center gap-2.5 rounded-full bg-[#12152a] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(18,21,42,0.35)] transition hover:-translate-y-0.5'>
                Read the terms
                <ArrowRight className='h-3.5 w-3.5' />
              </a>
              <Link
                href='/privacy'
                className='border-b border-slate-950/15 pb-0.5 text-sm font-semibold text-[#12152a]'>
                View privacy policy
              </Link>
            </div>

            <div className='mt-12 flex flex-wrap items-center justify-center gap-10'>
              {[
                { big: String(SECTION_COUNT), small: "Sections" },
                { big: String(TERM_GROUPS.length), small: "Topic groups" },
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

        {/* TERMS ACCORDION */}
        <section
          id='terms'
          className='border-t border-slate-950/10 px-5 py-16 sm:px-8 sm:py-24'>
          <div className='mx-auto max-w-3xl'>
            <div className='text-center'>
              <span
                style={mono}
                className='inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#ef3f63] before:h-px before:w-5 before:bg-current before:opacity-60 after:h-px after:w-5 after:bg-current after:opacity-60'>
                Full terms
              </span>
              <h2
                style={serif}
                className='mt-4 text-[28px] font-medium leading-tight sm:text-[36px]'>
                Every section, organized by topic.
              </h2>
            </div>

            <div className='mt-12 space-y-12'>
              {TERM_GROUPS.map((group) => (
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
              Questions about these terms?
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
            <Link href='/privacy' className='hover:text-[#12152a]'>
              Privacy
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
