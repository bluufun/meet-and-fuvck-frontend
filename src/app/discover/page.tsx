import { Suspense } from "react";
import LandingPageClient from "@/components/landing/LandingPageClient";

type PageProps = {
  searchParams?: Promise<{
    state?: string;
    lga?: string;
    gender?: string;
    orientation?: string;
    minAge?: string;
    maxAge?: string;
  }>;
};

export type ResolvedSearchParams = {
  state?: string;
  lga?: string;
  gender?: string;
  orientation?: string;
  minAge?: string;
  maxAge?: string;
};

async function resolveSearchParams(searchParams?: PageProps["searchParams"]) {
  return ((await searchParams) ?? {}) as ResolvedSearchParams;
}

export default async function HomePage({ searchParams }: PageProps) {
  const initialFilters = await resolveSearchParams(searchParams);

  return (
    <>
      {/*
        Server-rendered (this file has no "use client"), so it paints in
        the very first HTML response — no flash of the site's default
        white body background behind the swipe feed while client JS,
        the bottom nav, or the first card image are still loading.
      */}
      <div aria-hidden className='fixed inset-0 -z-10 bg-[#05070d]' />
      <Suspense>
        <LandingPageClient initialFilters={initialFilters} />
      </Suspense>
    </>
  );
}
