"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import MobileMenuPanel from "@/components/landing/MobileMenuPanel";
import BottomNav from "@/components/BottomNav";
import DesktopSidebar from "@/components/DesktopSidebar";

export default function FunmatePageChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <DesktopSidebar />

      {/* Mobile-only floating menu trigger — DesktopSidebar has its own Menu button at lg:+ */}
      <button
        type='button'
        onClick={() => setMenuOpen(true)}
        aria-label='Open menu'
        className='fixed right-4 top-4 z-[90] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-slate-950/20 text-white shadow-lg shadow-black/10 backdrop-blur-md transition hover:bg-slate-950/35 active:scale-95 lg:hidden'
        style={{
          top: "calc(1rem + env(safe-area-inset-top))",
          right: "calc(1rem + env(safe-area-inset-right))",
        }}>
        <Menu className='h-4 w-4' />
      </button>

      {children}
      <BottomNav hideOnDesktop />
      <MobileMenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
