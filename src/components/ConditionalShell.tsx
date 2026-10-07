"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "./BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { getAdminRedirect, isAdminPath } from "@/lib/adminGuards";
import { getProtectedRouteDecision } from "@/lib/routeAccess";
import {
  shouldHideBottomNavOnDesktop,
  shouldShowBottomNav,
} from "@/lib/layoutConstants";

const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const FUNMATE_PATH_PREFIXES = ["/funmate/"];
const INFO_PATHS = ["/faq", "/about-us", "/contact", "/terms", "/privacy"];

const PROTECTED_PATHS = [
  "/dashboard",
  "/activity",
  "/verification",
  "/onboarding",
  "/upload-gallery",
];

export default function ConditionalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const isAuthPage = AUTH_PATHS.some((path) => pathname.startsWith(path));
  const isFunmate = FUNMATE_PATH_PREFIXES.some((path) =>
    pathname.startsWith(path),
  );
  const isAdminPage = isAdminPath(pathname);
  const isInfoPage = INFO_PATHS.includes(pathname);
  const isProtectedPage = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  const protectedRedirect =
    !loading && isProtectedPage
      ? getProtectedRouteDecision(pathname, user).redirectTo
      : null;
  const adminRedirect = getAdminRedirect(pathname, loading, user);
  const shouldHoldAdminPage =
    Boolean(adminRedirect) || (isAdminPage && loading);
  const shouldHoldProtectedPage =
    Boolean(protectedRedirect) || (isProtectedPage && loading);
  const showBottomNav = shouldShowBottomNav(pathname);
  const isDiscoverPage = pathname === "/discover";
  const showNavbar =
    pathname !== "/" &&
    !isInfoPage &&
    !isFunmate &&
    !isDiscoverPage &&
    !(isProtectedPage && (!user || Boolean(protectedRedirect)));

  const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

  useIsomorphicLayoutEffect(() => {
    if (isAdminPage) {
      if (adminRedirect) {
        router.replace(adminRedirect);
      }
      return;
    }

    if (!isProtectedPage) return;
    if (loading) return;
    if (protectedRedirect) {
      router.replace(protectedRedirect);
      return;
    }
    if (!user) {
      router.replace("/login");
    }
  }, [
    adminRedirect,
    isAdminPage,
    isProtectedPage,
    loading,
    protectedRedirect,
    router,
    user,
  ]);

  if (shouldHoldAdminPage || shouldHoldProtectedPage) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F8FAFF]'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent' />
      </div>
    );
  }

  if (isAuthPage || isFunmate || isInfoPage) {
    return <>{children}</>;
  }

  return (
    <>
      {showNavbar && (
        <Navbar
          desktopSidebarOffset={
            pathname === "/dashboard" || pathname === "/activity"
          }
        />
      )}
      <div className={`flex-1 ${showNavbar ? "pt-[88px] lg:pt-[96px]" : ""}`}>
        {children}
      </div>
      {showBottomNav && (
        <BottomNav hideOnDesktop={shouldHideBottomNavOnDesktop(pathname)} />
      )}
    </>
  );
}