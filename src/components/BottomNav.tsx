"use client";

import type { ComponentType } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Compass, House, BellRing, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BOTTOM_NAV_HEIGHT } from "@/lib/layoutConstants";

type NavItem = {
  label: string;
  active: boolean;
  action?: () => void;
  icon: ComponentType<{ className?: string }>;
};

function NavButton({
  label,
  active,
  action,
  icon: Icon,
  dark = false,
}: NavItem & { dark?: boolean }) {
  return (
    <button
      type='button'
      onClick={action}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-2 transition active:scale-[0.98] ${
        dark
          ? active
            ? " text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
          : active
            ? " text-[#1E3A8A]"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
      }`}>
      <Icon
        className={`h-5 w-5  ${active ? "stroke-[2.25]" : "stroke-[1.9]"}`}
      />
      <span className='text-[10px] font-semibold tracking-tight'>{label}</span>
    </button>
  );
}

export default function BottomNav({
  hideOnDesktop = false,
}: {
  // Pages that have their own desktop nav (DesktopSidebar) pass this so the
  // mobile bottom bar doesn't double up at lg:+. Defaults to false so every
  // existing caller keeps its current behavior unchanged.
  hideOnDesktop?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  // Landing ("/") is a full-bleed media feed — a white nav bar disappears
  // against light photos, so it gets a dark, translucent variant instead.
  // Every other page keeps the existing white bar untouched.
  const isLanding = pathname === "/discover";

  function handleHome() {
    if (pathname === "/") {
      router.replace("/");
      router.refresh();
      return;
    }
    router.push("/");
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
    },
    {
      label: "Profile",
      active: user?.adminRole
        ? pathname.startsWith("/admin")
        : pathname.startsWith("/dashboard"),
      action: () => router.push(user?.adminRole ? "/admin" : "/dashboard"),
      icon: UserRound,
    },
  ];

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-0 pointer-events-none ${
          isLanding ? "bg-black" : "bg-white"
        } ${hideOnDesktop ? "lg:hidden" : ""}`}>
        <div
          className={`pointer-events-auto px-2 py-2 ${
            isLanding
              ? "bg-black backdrop-blur-md border border-white/10 shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
              : ""
          }`}
          style={{
            minHeight: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}>
          <div className='grid h-full grid-cols-4 items-stretch gap-6 '>
            {navItems.map((item) => (
              <NavButton key={item.label} {...item} dark={isLanding} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
