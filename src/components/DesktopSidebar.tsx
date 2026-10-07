"use client";

// Desktop-only (lg:+) replacement for the mobile BottomNav + hamburger menu
// button combo. Rendered fixed to the left edge at w-24 (96px) — pages that
// sit next to it should offset their content with `lg:pl-24`, and any other
// fixed-position siblings (e.g. UpNextRail) should account for this width in
// their own centering math. See landing/UpNextRail.tsx and
// LandingPageClient.tsx for the paired 96px/360px constants.

import type { ComponentType } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, House, BellRing, UserRound, Menu } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import MobileMenuPanel from "@/components/landing/MobileMenuPanel";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { isAdminUser } from "@/lib/adminGuards";

const PRIMARY = "#1E3A8A";

type NavItem = {
  label: string;
  active: boolean;
  action: () => void;
  icon: ComponentType<{ className?: string }>;
  badgeCount?: number;
};

function RailButton({
  label,
  active,
  action,
  icon: Icon,
  badgeCount,
}: NavItem) {
  return (
    <button
      type='button'
      onClick={action}
      aria-current={active ? "page" : undefined}
      className={`flex w-16 flex-col items-center gap-1 rounded-2xl py-2.5 transition active:scale-[0.97] ${
        active
          ? "bg-[#3B82F6]/10 text-[#1E3A8A]"
          : "text-slate-400 hover:bg-slate-50 hover:text-slate-800"
      }`}>
      <span className='relative inline-flex'>
        <Icon
          className={`h-5 w-5 ${active ? "stroke-[2.25]" : "stroke-[1.9]"}`}
        />
        {badgeCount ? (
          <span className='absolute -right-2 -top-2 min-w-4 rounded-full bg-red-500 px-1 py-0.5 text-[9px] font-bold leading-none text-white shadow'>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : null}
      </span>
      <span className='text-[10.5px] font-semibold tracking-tight'>
        {label}
      </span>
    </button>
  );
}

export default function DesktopSidebar({
  showLogo = true,
}: {
  showLogo?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleHome() {
    if (pathname === "/") {
      router.replace("/");
      router.refresh();
      return;
    }
    router.push("/");
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const navItems: NavItem[] = [
    {
      label: "Home",
      active: pathname === "/",
      action: handleHome,
      icon: House,
    },
    {
      label: "Discover",
      active: pathname === "/discover",
      action: () => router.push("/discover"),
      icon: Compass,
    },
    {
      label: "Activity",
      active: pathname === "/activity",
      action: () => router.push("/activity"),
      icon: BellRing,
      badgeCount: unreadCount,
    },
    {
      label: "Profile",
      active: pathname.startsWith("/dashboard"),
      action: () => router.push(isAdminUser(user) ? "/admin" : "/dashboard"),
      icon: UserRound,
    },
  ];

  return (
    <>
      <aside
        aria-label='Primary'
        className='fixed left-0 top-0 bottom-0 z-40 hidden w-24 flex-col items-center border-r border-slate-200 bg-white py-6 lg:flex'>
        {showLogo && (
          <Link href='/' aria-label='Bluufun home' className='mb-8 inline-flex'>
            <BrandLogo width={70} height={40} priority />
          </Link>
        )}

        <nav className='flex flex-1 flex-col items-center gap-2'>
          {navItems.map((item) => (
            <RailButton key={item.label} {...item} />
          ))}
        </nav>

        <button
          type='button'
          onClick={() => setMenuOpen(true)}
          className='mb-5 flex w-16 flex-col items-center gap-1 rounded-2xl py-2.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-800'>
          <Menu className='h-5 w-5 stroke-[1.9]' />
          <span className='text-[10.5px] font-semibold tracking-tight'>
            Menu
          </span>
        </button>

        {!loading &&
          (user ? (
            <button
              type='button'
              onClick={handleLogout}
              title='Log out'
              aria-label='Log out'
              className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[13px] font-bold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900'>
              {user.username?.[0]?.toUpperCase() ?? "U"}
            </button>
          ) : (
            <div className='flex flex-col items-center gap-2'>
              <Link
                href='/login'
                className='w-16 rounded-full border border-slate-200 py-1.5 text-center text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50'>
                Log in
              </Link>
              <Link
                href='/register'
                className='w-16 rounded-full py-1.5 text-center text-[11px] font-semibold text-white transition hover:opacity-90'
                style={{ backgroundColor: PRIMARY }}>
                Sign up
              </Link>
            </div>
          ))}
      </aside>

      <MobileMenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
