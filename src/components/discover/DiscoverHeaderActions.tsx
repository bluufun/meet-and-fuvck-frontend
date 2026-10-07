"use client";

import Link from "next/link";
import { BellRing } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

// Right-hand side of the discover header. Auth-aware so each visitor only
// sees what's actionable for them:
//   • signed out → "Log in" + a prominent "Register" call-to-action
//   • signed in  → the notification bell with a live unread badge
// While the session is still resolving we reserve the same footprint, so the
// header never jumps when auth settles.
export default function DiscoverHeaderActions() {
  const { user, loading } = useAuth();
  const { unreadCount } = useUnreadNotifications();

  if (loading) {
    return <div aria-hidden className='h-9 w-[132px]' />;
  }

  if (!user) {
    return (
      <div className='flex items-center gap-1.5'>
        <Link
          href='/login'
          className='rounded-full px-3 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-900/[0.05] active:scale-95'>
          Log in
        </Link>
        <Link
          href='/register'
          className='rounded-full bg-[#1E3A8A] px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#163172] hover:shadow-md active:scale-95'>
          Register
        </Link>
      </div>
    );
  }

  const badge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Link
      href='/activity'
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
      className='relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/80 text-[#1E3A8A] transition hover:border-blue-200 hover:bg-blue-50'>
      <BellRing className='h-4 w-4 stroke-2 text-[#1E3A8A]' />
      {unreadCount > 0 && (
        <span className='absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-500 px-1 py-0.5 text-center text-[10px] font-bold leading-none text-white shadow ring-2 ring-[#F6F7FB]'>
          {badge}
        </span>
      )}
    </Link>
  );
}
