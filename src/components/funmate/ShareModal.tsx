"use client";

import { Link } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  /** Public profile URL, e.g. https://bluufun.com/funmate/janedoe */
  url: string;
  /** Display username, used to write the share caption */
  username: string;
}

type ShareTarget = {
  id: string;
  label: string;
  bg: string;
  icon: React.ReactNode;
  getHref?: (url: string, text: string) => string;
  onClick?: (url: string, text: string) => void;
};

function IconWhatsApp() {
  return (
    <svg viewBox='0 0 24 24' fill='white' className='w-6 h-6'>
      <path d='M17.47 14.38c-.29-.15-1.7-.84-1.96-.93-.26-.1-.46-.15-.65.15-.2.29-.75.93-.92 1.12-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.48.1-.2.05-.37-.02-.51-.08-.15-.65-1.58-.9-2.16-.24-.58-.48-.5-.65-.5-.17 0-.37-.02-.56-.02s-.51.07-.78.37c-.26.29-1.02 1-1.02 2.44s1.05 2.82 1.19 3.02c.15.2 2.07 3.16 5.02 4.43.7.3 1.25.48 1.68.62.7.22 1.34.19 1.85.11.56-.08 1.7-.7 1.94-1.37.24-.68.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34z' />
      <path d='M12.02 2C6.5 2 2.04 6.44 2.04 11.93c0 1.87.5 3.62 1.44 5.13L2 22l5.12-1.42a10 10 0 004.9 1.28c5.52 0 10-4.44 10-9.93S17.54 2 12.02 2zm0 18.02c-1.6 0-3.1-.46-4.36-1.26l-.31-.19-3.04.84.82-2.95-.2-.31a8.05 8.05 0 01-1.25-4.24c0-4.45 3.63-8.06 8.34-8.06 4.6 0 8.34 3.6 8.34 8.06s-3.74 8.06-8.34 8.06z' />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox='0 0 24 24' fill='white' className='w-5 h-5'>
      <path d='M18.24 2H21l-6.56 7.5L22.2 22h-6.2l-4.86-6.36L5.5 22H2.72l7.02-8.02L1.8 2h6.35l4.4 5.82L18.24 2zm-1.08 18.17h1.72L7.3 3.75H5.46l11.7 16.42z' />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg viewBox='0 0 24 24' fill='white' className='w-6 h-6'>
      <path d='M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z' />
    </svg>
  );
}

function IconTelegram() {
  return (
    <svg viewBox='0 0 24 24' fill='white' className='w-6 h-6'>
      <path d='M21.94 3.67L18.6 20.14c-.25 1.13-.92 1.4-1.86.87l-5.14-3.79-2.48 2.39c-.28.28-.51.51-1.04.51l.37-5.26L18 5.9c.4-.36-.09-.56-.63-.2L6.5 12.67l-5.07-1.58c-1.1-.35-1.12-1.1.23-1.62L20.5 2.6c.92-.34 1.72.22 1.44 1.07z' />
    </svg>
  );
}

function IconMessenger() {
  return (
    <svg viewBox='0 0 24 24' fill='white' className='w-6 h-6'>
      <path d='M12 2C6.48 2 2 6.19 2 11.38c0 2.96 1.44 5.6 3.7 7.32V22l3.38-1.86c.9.25 1.86.38 2.92.38 5.52 0 10-4.19 10-9.38S17.52 2 12 2zm1.02 12.62l-2.55-2.72-4.98 2.72 5.48-5.82 2.6 2.72 4.93-2.72-5.48 5.82z' />
    </svg>
  );
}

function IconMail() {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='white'
      strokeWidth={1.8}
      className='w-6 h-6'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M3 6.75A1.75 1.75 0 014.75 5h14.5A1.75 1.75 0 0121 6.75v10.5A1.75 1.75 0 0119.25 19H4.75A1.75 1.75 0 013 17.25V6.75z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M3.5 6.5l8.5 6 8.5-6'
      />
    </svg>
  );
}

function IconSms() {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='white'
      strokeWidth={1.8}
      className='w-6 h-6'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M21 12a8 8 0 01-11.6 7.13L4 20l1.13-4.2A8 8 0 1121 12z'
      />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg viewBox='0 0 24 24' fill='white' className='w-6 h-6'>
      <path d='M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.64h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9z' />
    </svg>
  );
}

function IconShareTo() {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='white'
      strokeWidth={1.8}
      className='w-6 h-6'>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M12 15V3m0 0L8 7m4-4l4 4M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6'
      />
    </svg>
  );
}

export default function ShareModal({
  open,
  onClose,
  url,
  username,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const caption = `Check out ${username}'s profile on Bluufun`;
  const encodedUrl = encodeURIComponent(url);
  const encodedCaption = encodeURIComponent(caption);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const targets: ShareTarget[] = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      bg: "bg-[#25D366]",
      icon: <IconWhatsApp />,
      getHref: () => `https://wa.me/?text=${encodedCaption}%20${encodedUrl}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      bg: "bg-[#1877F2]",
      icon: <IconFacebook />,
      getHref: () =>
        `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: "x",
      label: "X",
      bg: "bg-black",
      icon: <IconX />,
      getHref: () =>
        `https://twitter.com/intent/tweet?text=${encodedCaption}&url=${encodedUrl}`,
    },
    {
      id: "telegram",
      label: "Telegram",
      bg: "bg-[#26A5E4]",
      icon: <IconTelegram />,
      getHref: () =>
        `https://t.me/share/url?url=${encodedUrl}&text=${encodedCaption}`,
    },
    {
      id: "messenger",
      label: "Messenger",
      bg: "bg-gradient-to-br from-[#00B2FF] to-[#7A5AF8]",
      icon: <IconMessenger />,
      getHref: () =>
        `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=0&redirect_uri=${encodedUrl}`,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      bg: "bg-[#0A66C2]",
      icon: <IconLinkedIn />,
      getHref: () =>
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      id: "sms",
      label: "Text",
      bg: "bg-[#34C759]",
      icon: <IconSms />,
      getHref: () => `sms:?body=${encodedCaption}%20${encodedUrl}`,
    },
    {
      id: "email",
      label: "Email",
      bg: "bg-[#64748B]",
      icon: <IconMail />,
      getHref: () => `mailto:?subject=${encodedCaption}&body=${encodedUrl}`,
    },
  ];

  return createPortal(
    <div className='fixed inset-0 z-[95] flex items-end sm:items-center sm:justify-center'>
      <button
        onClick={onClose}
        aria-label='Close share sheet'
        className='absolute inset-0 bg-slate-950/50 backdrop-blur-[4px]'
      />
      <div className='relative w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl bg-white shadow-[0_-20px_60px_rgba(15,23,42,0.25)] sm:shadow-[0_30px_90px_rgba(15,23,42,0.25)] max-h-[85vh] overflow-y-auto'>
        <div className='sticky top-0 flex items-center justify-between bg-white/95 backdrop-blur px-5 pt-5 pb-3 border-b border-slate-100'>
          <h2 className='text-lg font-bold text-slate-950'>Share profile</h2>
          <button
            onClick={onClose}
            className='rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600'>
            Close
          </button>
        </div>

        <div className='px-5 pt-4'>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-2'>
            Your link
          </p>
          <div className='flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 pl-4'>
            <span className='flex-1 truncate text-sm text-slate-700'>
              {url}
            </span>
            <button
              onClick={copyLink}
              className='shrink-0 flex items-center gap-1.5 rounded-xl bg-[#1E3A8A] px-3.5 py-2 text-xs font-semibold text-white'>
              <Link className='w-3.5 h-3.5' />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className='px-5 py-5'>
          <div className='grid grid-cols-4 gap-y-5 gap-x-2 text-center'>
            {targets.map((t) => (
              <a
                key={t.id}
                href={t.getHref?.(url, caption)}
                target='_blank'
                rel='noopener noreferrer'
                className='flex flex-col items-center gap-1.5'>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${t.bg}`}>
                  {t.icon}
                </span>
                <span className='text-[11px] font-medium text-slate-600'>
                  {t.label}
                </span>
              </a>
            ))}

            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={() =>
                  navigator.share({ title: caption, url }).catch(() => {})
                }
                className='flex flex-col items-center gap-1.5'>
                <span className='flex h-12 w-12 items-center justify-center rounded-full bg-slate-400'>
                  <IconShareTo />
                </span>
                <span className='text-[11px] font-medium text-slate-600'>
                  Share to...
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
