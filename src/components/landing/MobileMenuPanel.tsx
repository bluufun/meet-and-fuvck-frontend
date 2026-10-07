"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Headset,
  UserRoundGroup,
  MessageCircleQuestionMark,
  Scale,
  ShieldCheck,
  X,
  House,
} from "lucide-react";
import { createPortal } from "react-dom";
import { IoLogoInstagram } from "react-icons/io";
import { FaTiktok } from "react-icons/fa6";
import { TbBrandTelegram } from "react-icons/tb";
import BrandLogo from "@/components/BrandLogo";
import { api } from "@/lib/api";
import { AiOutlineWhatsApp } from "react-icons/ai";
import { MdPolicy } from "react-icons/md";

const PRIMARY = "#1E3A8A";

type SocialLinks = {
  telegram: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
};

const MENU_SECTIONS = [
  {
    title: "Home",
    items: [{ label: "Home", href: "/", icon: House }],
  },
  {
    title: "About",
    items: [
      { label: "About Bluufun", href: "/about-us", icon: UserRoundGroup },
    ],
  },
  {
    title: "Help & Support",
    items: [
      {
        label: "FAQ Center",
        href: "/faq",
        icon: MessageCircleQuestionMark,
      },
    ],
  },

  {
    title: "Contact",
    items: [
      {
        label: "Contact Us",
        href: "/contact",
        icon: Headset,
      },
    ],
  },

  {
    title: "Legal",
    items: [{ label: "Terms of Use", href: "/terms", icon: Scale }],
  },
  {
    title: "Privacy",
    items: [
      {
        label: "Privacy Policy",
        href: "/privacy",
        icon: MdPolicy,
      },
    ],
  },
];

function MenuRow({
  href,
  label,
  icon: Icon,
  onClick,
  active,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center justify-between border-b border-slate-100 py-2 transition-colors ${
        active
          ? "rounded-md bg-slate-200 px-4 text-[#1E3A8A]"
          : "text-slate-800 px-4"
      }`}>
      <span className='flex items-center gap-3'>
        <Icon
          className={`h-5 w-5 ${active ? "text-[#1E3A8A]" : "text-slate-800"}`}
        />

        <span
          className={`text-[16px] font-medium tracking-tight transition-colors duration-200 ${
            active
              ? "text-[#1E3A8A]"
              : "text-slate-800 group-hover:text-slate-950"
          }`}>
          {label}
        </span>
      </span>
    </Link>
  );
}

export default function MobileMenuPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

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

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const content = (
    <div
      className='fixed inset-0 z-[80]'
      aria-hidden={!open}
      style={{ pointerEvents: open ? "auto" : "none" }}>
      <div
        onClick={onClose}
        className='absolute inset-0 bg-slate-950/20 transition-opacity duration-300 backdrop-blur-sm'
        style={{ opacity: open ? 1 : 0 }}
      />

      <aside
        onClick={(event) => event.stopPropagation()}
        className='absolute left-0 top-0 flex h-full w-[65vw] max-w-sm flex-col overflow-y-auto bg-slate-50 transition-transform duration-300 ease-out'
        style={{
          transform: open ? "translateX(0)" : "translateX(-102%)",
          boxShadow: "40px 0 80px -30px rgba(15, 23, 42, 0.18)",
        }}>
        {/* Header */}
        <div className='flex items-center justify-between px-6 pb-5 pt-7'>
          <Link href='/' onClick={onClose} className='inline-flex items-center'>
            <BrandLogo width={110} height={40} priority />
          </Link>

          <button
            type='button'
            onClick={onClose}
            className='flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-900'
            aria-label='Close menu'>
            <X className='h-[18px] w-[18px]' strokeWidth={1.75} />
          </button>
        </div>

        <div className='h-px w-full bg-slate-100' />

        {/* Menu */}
        <div className='flex-1 px-3 pb-6'>
          <nav className='space-y-3'>
            {MENU_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className='mb-1 text-[12px] font-medium text-slate-400'></p>
                <div>
                  {section.items.map((item) => (
                    <MenuRow
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      onClick={onClose}
                      active={pathname === item.href}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className='mt-auto border-t border-slate-100 px-6 py-6'>
          <p className='mb-3 text-[10px] text-center font-semibold uppercase tracking-[0.3em] text-slate-400'>
            Follow
          </p>
          <div className='flex justify-center items-center gap-x-5 gap-y-3'>
            {[
              {
                label: "Telegram",
                href: socialLinks?.telegram,
                icon: TbBrandTelegram,
              },
              {
                label: "Instagram",
                href: socialLinks?.instagram,
                icon: IoLogoInstagram,
              },
              { label: "TikTok", href: socialLinks?.tiktok, icon: FaTiktok },
              {
                label: "WhatsApp",
                href: socialLinks?.whatsapp,
                icon: AiOutlineWhatsApp,
              },
            ]
              .filter((item) => item.href)
              .map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target='_blank'
                  rel='noreferrer'
                  className='group flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition hover:text-slate-950'>
                  <Icon
                    className='h-[15px] w-[15px] text-slate-500'
                    strokeWidth={1.75}
                  />
                </a>
              ))}
          </div>

          <span className='mt-3 block text-center text-[10px] text-gray-400'>
            &copy; {new Date().getFullYear()} Bluufun. All rights reserved.
          </span>
        </div>
      </aside>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
