"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import BrandLogo from "@/components/BrandLogo";
import { BellRing } from "lucide-react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

function IconLogout({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}>
      <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
      <polyline points='16 17 21 12 16 7' />
      <line x1='21' y1='12' x2='9' y2='12' />
    </svg>
  );
}

export default function Navbar({
  desktopSidebarOffset = false,
}: {
  desktopSidebarOffset?: boolean;
}) {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const { unreadCount } = useUnreadNotifications();

  async function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 px-4 py-4 ${desktopSidebarOffset ? "lg:left-24 lg:right-0" : ""}`}>
      <div className='flex items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-md'>
        {/* Left: logo */}
        <Link href='/' className='flex items-center gap-3'>
          <BrandLogo width={110} height={36} priority />
        </Link>

        {/* Right: auth-dependent actions */}
        {!loading && (
          <div className='flex items-center gap-3'>
            {user ? (
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => router.push("/activity")}
                  aria-label='Open notifications'
                  className='relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/80 text-[#1E3A8A] transition hover:border-blue-200 hover:bg-blue-50'>
                  <BellRing className='h-4 w-4 stroke-2 text-[#1E3A8A]' />
                  {unreadCount > 0 && (
                    <span className='absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow'>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              <button
                  type='button'
                  onClick={handleLogout}
                  aria-label='Logout'
                  className='flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/80 transition hover:border-red-200 hover:bg-red-50'>
                  <IconLogout className='w-4 h-4 text-[#1E3A8A] stroke-2' />
                </button>
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <Link
                  href='/login'
                  className='rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100'>
                  Login
                </Link>
                <Link
                  href='/register'
                  className='rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-[#1E3A8A] transition hover:bg-blue-100'>
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
