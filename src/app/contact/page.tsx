"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import { Menu, BotMessageSquare, Mail, MessageCircleMore } from "lucide-react";
import { FaInstagram, FaTiktok } from "react-icons/fa6";
import { TbBrandTelegram } from "react-icons/tb";
import BrandLogo from "@/components/BrandLogo";
import MobileMenuPanel from "@/components/landing/MobileMenuPanel";
import { api } from "@/lib/api";

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

type SocialLinks = {
  telegram: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
};

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='currentColor'
      className={className}
      aria-hidden='true'>
      <path d='M21.935 4.435a1.012 1.012 0 0 0-1.025-.189L2.89 11.235a.99.99 0 0 0-.629.914.98.98 0 0 0 .7.93l4.335 1.333 1.668 5.14c.128.395.53.639.94.572a.99.99 0 0 0 .527-.272l2.498-2.408 4.046 2.976c.18.134.396.2.612.2a1 1 0 0 0 .994-.831l2.005-14.282a1.01 1.01 0 0 0-.651-1.092ZM9.56 14.72l-.285 2.034-.81-2.495 7.14-5.17-6.045 5.631Z' />
    </svg>
  );
}

export default function ContactPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);

  useEffect(() => {
    let active = true;
    api.settings
      .socialLinks()
      .then((data) => {
        if (active) setSocialLinks(data.links);
      })
      .catch(() => {
        if (active) setSocialLinks(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const contactOptions = [
    {
      num: "01",
      title: "Email support",
      value: "support@bluufun.com",
      href: "mailto:support@bluufun.com",
      icon: Mail,
    },
    {
      num: "02",
      title: "WhatsApp help",
      value: "Chat with the team",
      href: socialLinks?.whatsapp || "https://wa.me/",
      icon: MessageCircleMore,
    },
    {
      num: "03",
      title: "Telegram channel",
      value: "Join our Telegram channel",
      href: socialLinks?.telegram || "https://t.me/",
      icon: TelegramIcon,
    },
    {
      num: "04",
      title: <div data-bot-inline />,
      value: "Available 24/7",
      href: "",
      icon: BotMessageSquare,
    },
  ];

  const socialItems = [
    { label: "Telegram", href: socialLinks?.telegram, icon: TbBrandTelegram },
    { label: "Instagram", href: socialLinks?.instagram, icon: FaInstagram },
    { label: "TikTok", href: socialLinks?.tiktok, icon: FaTiktok },
    { label: "WhatsApp", href: socialLinks?.whatsapp, icon: MessageCircleMore },
  ].filter((item) => item.href);

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
                  link.href === "/contact" ? "font-semibold text-[#12152a]" : ""
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
              Support
            </span>
            <h1
              style={serif}
              className='mt-5 text-[38px] font-medium leading-[1.06] tracking-tight sm:text-[52px]'>
              Talk to a{" "}
              <em className='bg-gradient-to-r from-[#ef3f63] to-[#ff8a4c] bg-clip-text font-medium text-transparent'>
                human,
              </em>{" "}
              fast.
            </h1>
            <p className='mx-auto mt-5 max-w-xl text-[17px] leading-7 text-slate-500'>
              Use the quickest path to reach the Bluufun team when you need
              help, clarification, or a human response.
            </p>
          </div>
        </section>

        {/* CONTACT OPTIONS */}
        <section className='border-t border-slate-950/10 px-5 py-16 sm:px-8 sm:py-24'>
          <div className='mx-auto max-w-5xl'>
            <div className='max-w-xl'>
              <span
                style={mono}
                className='inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[#0f236b]'>
                Reach us
              </span>
              <h2
                style={serif}
                className='mt-4 text-[28px] font-medium leading-tight sm:text-[36px]'>
                Pick whichever channel is easiest for you.
              </h2>
            </div>

            <div className='mt-12 grid gap-5 sm:grid-cols-2'>
              {contactOptions.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.title as string}
                    href={item.href || undefined}
                    className='group flex items-center gap-4 rounded-[18px] border border-slate-950/10 bg-white p-6 shadow-[0_18px_34px_-26px_rgba(18,21,42,0.22)] transition hover:-translate-y-0.5 hover:border-[#ef3f63]/30'>
                    <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-950/10 bg-gradient-to-br from-[#4a7dff]/15 to-[#ef3f63]/15'>
                      <Icon className='h-5 w-5' strokeWidth={1.8} />
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span
                        style={serif}
                        className='block text-xs italic text-slate-400'>
                        {item.num}
                      </span>
                      <span className='mt-0.5 block text-[15.5px] font-semibold'>
                        {item.title}
                      </span>
                      <span className='mt-0.5 block text-sm text-slate-500'>
                        {item.value}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* FOLLOW */}
        {socialItems.length > 0 && (
          <section className='border-t border-slate-950/10 px-5 py-16 sm:px-8 sm:py-20'>
            <div className='mx-auto max-w-6xl'>
              <div className='rounded-[28px] border border-slate-950/10 bg-white p-9 shadow-[0_18px_34px_-26px_rgba(18,21,42,0.22)]'>
                <span
                  style={mono}
                  className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-400'>
                  Follow Bluufun
                </span>
                <div className='mt-4 flex flex-wrap gap-3'>
                  {socialItems.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-2 rounded-full border border-slate-950/10 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-[#ef3f63]/30 hover:text-[#12152a]'>
                      <Icon className='h-4 w-4' />
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* RESPONSE NOTE */}
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
              We usually reply within a few hours.
            </h2>
            <p className='mt-4 max-w-sm text-[15.5px] leading-7 text-slate-500'>
              For anything urgent, WhatsApp or BluuBot will get you the fastest
              response.
            </p>
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
            <Link href='/faq' className='hover:text-[#12152a]'>
              FAQ
            </Link>
          </div>
        </div>
      </footer>

      <MobileMenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
