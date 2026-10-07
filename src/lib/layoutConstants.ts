// Height of the bottom nav's content row, in px — excludes the safe-area
// inset (notch/home-indicator), which is added on top of this via
// env(safe-area-inset-bottom) wherever it's used.
export const BOTTOM_NAV_HEIGHT = 35;

// Routes that get the bottom nav at all. Shared by ConditionalShell (the
// "real" render) and ShellClient's pre-mount fallback so both agree on
// exactly the same set of paths.
export const BOTTOM_NAV_PATHS = [
  "/",
  "/dashboard",
  "/activity",
  "/admin",
  "/discover",
];

export function shouldShowBottomNav(pathname: string) {
  return BOTTOM_NAV_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

// Pages that render their own desktop nav (DesktopSidebar) so the mobile
// bottom bar shouldn't double up at lg:+.
export function shouldHideBottomNavOnDesktop(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/dashboard" ||
    pathname === "/activity" ||
    pathname === "/discover" ||
    pathname.startsWith("/admin")
  );
}
