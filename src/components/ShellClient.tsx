"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ConditionalShell from "@/components/ConditionalShell";
import BottomNav from "@/components/BottomNav";
import {
  shouldHideBottomNavOnDesktop,
  shouldShowBottomNav,
} from "@/lib/layoutConstants";

export default function ShellClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // ConditionalShell waits for this same "mounted" tick before rendering
    // itself, because the top Navbar and the admin/protected redirects it
    // drives depend on client-only auth state that isn't safe to render
    // during the first paint.
    //
    // The bottom nav has no such dependency — it only needs the current
    // path — so it doesn't need to wait. Without this fallback it was
    // simply missing for that first tick: on a hard reload of "/" that
    // showed as the site's default white background where the (dark,
    // on landing) nav should be, and if the feed was still loading it
    // looked like the nav icons had disappeared entirely.
    return (
      <>
        {children}
        {shouldShowBottomNav(pathname) && (
          <BottomNav hideOnDesktop={shouldHideBottomNavOnDesktop(pathname)} />
        )}
      </>
    );
  }

  return <ConditionalShell>{children}</ConditionalShell>;
}
