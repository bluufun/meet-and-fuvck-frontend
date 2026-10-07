"use client";

import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import StepMedia from "@/components/onboarding/StepMedia";
import { NIGERIA_STATES, getLGAs } from "@/lib/nigeria-locations";
import {
  BODY_TYPES,
  HEIGHTS,
  SKIN_TONES,
  BUST_SIZES,
} from "@/lib/profileOptions";
import { useAuth } from "@/context/AuthContext";
import { invalidateUserEverywhere } from "@/lib/apiCache";
import { friendlyApiMessage, friendlyApiError } from "@/lib/apiMessages";
import { getProtectedRouteDecision } from "@/lib/routeAccess";
import BookingRatesEditor from "@/components/booking/BookingRatesEditor";

// ─────────────────────────────────────────────────────────────────────────────
// Icon set
// ─────────────────────────────────────────────────────────────────────────────
function Icon({
  name,
  className = "w-5 h-5",
}: {
  name: string;
  className?: string;
}) {
  const icons: Record<string, React.ReactElement> = {
    fun: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        />
      </svg>
    ),
    relationship: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
        />
      </svg>
    ),
    both: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
        />
      </svg>
    ),
    secondary: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
        />
      </svg>
    ),
    diploma: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
        />
      </svg>
    ),
    bsc: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 14l9-5-9-5-9 5 9 5z'
        />
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
        />
      </svg>
    ),
    msc: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
        />
      </svg>
    ),
    phd: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
        />
      </svg>
    ),
    vocational: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
        />
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
        />
      </svg>
    ),
    prefer_not: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
        />
      </svg>
    ),
    corporate: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
        />
      </svg>
    ),
    business: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
        />
      </svg>
    ),
    corper: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9'
        />
      </svg>
    ),
    student: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
        />
      </svg>
    ),
    creative: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
        />
      </svg>
    ),
    tech: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
        />
      </svg>
    ),
    medical: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M4.5 12.75l6 6 9-13.5'
        />
      </svg>
    ),
    handwork: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z'
        />
      </svg>
    ),
    civil_service: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z'
        />
      </svg>
    ),
    freelance: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9'
        />
      </svg>
    ),
    unemployed: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
        />
      </svg>
    ),
    male: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M16 7h5m0 0v5m0-5l-6 6-3-3-6 6'
        />
      </svg>
    ),
    female: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <circle cx='12' cy='9' r='4' />
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 13v8m-3-3h6'
        />
      </svg>
    ),
    trans: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 3v18m-4-4l4 4 4-4M8 7l4-4 4 4'
        />
      </svg>
    ),
    nonbinary: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 3v18M3 12h18'
        />
      </svg>
    ),
    straight: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
        />
      </svg>
    ),
    bisexual: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
        />
      </svg>
    ),
    gay: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
        />
      </svg>
    ),
    lesbian: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
        />
      </svg>
    ),
    party: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
        />
      </svg>
    ),
    clubbing: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
        />
      </svg>
    ),
    travel: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        />
      </svg>
    ),
    date: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
        />
      </svg>
    ),
    fwb: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11'
        />
      </svg>
    ),
    cook: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
        />
      </svg>
    ),
    listener: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
        />
      </svg>
    ),
    advisor: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
        />
      </svg>
    ),
    gym: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z'
        />
      </svg>
    ),
    movies: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z'
        />
      </svg>
    ),
    gaming: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z'
        />
      </svg>
    ),
    outdoor: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M3 7l9-4 9 4M3 7v13l9 4 9-4V7M3 7l9 4m9-4l-9 4m0 0v13'
        />
      </svg>
    ),
    shopping: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
        />
      </svg>
    ),
    networking: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
        />
      </svg>
    ),
    spiritual: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707'
        />
      </svg>
    ),
    mentorship: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
        />
      </svg>
    ),
    karaoke: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
        />
      </svg>
    ),
    road_trip: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
        />
      </svg>
    ),
    beach: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 3v1m0 16v1M4.22 4.22l.707.707m12.728 12.728l.707.707M1 12h1m18 0h1M4.22 19.78l.707-.707M18.071 5.929l.707-.707'
        />
      </svg>
    ),
    conversation: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
        />
      </svg>
    ),
    spontaneous: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M13 10V3L4 14h7v7l9-11h-7z'
        />
      </svg>
    ),
    check: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={2.5}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
      </svg>
    ),
    location: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
        />
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
        />
      </svg>
    ),
    age: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
        />
      </svg>
    ),
    vibe: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'
        />
      </svg>
    ),
    want: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.8}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
        />
      </svg>
    ),
    chevron_down: (
      <svg
        className={className}
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={2}>
        <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
      </svg>
    ),
  };
  return icons[name] ?? <span className={className} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface OnboardingData {
  intent: string[];
  age: string;
  state: string;
  lga: string;
  country: string;
  education: string;
  occupation: string;
  gender: string;
  orientation: string;
  bodyType: string[];
  height: string;
  skinTone: string;
  bustSize: string;
  experiences: string[];
  currentWant: string;
  vibeBio: string;
  bookingRates: import("@/lib/bookingRates").BookingRate[];
}

const TOTAL_STEPS = 12;

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI components
// ─────────────────────────────────────────────────────────────────────────────
function Chip({
  label,
  iconName,
  selected,
  onClick,
}: {
  label: string;
  iconName?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-all duration-150
        ${selected ? "border-[#1E3A8A] bg-[#EFF6FF] text-[#1E3A8A] shadow-sm shadow-[#1E3A8A]/10" : "border-[#E2E8F0] bg-white text-[#334155] hover:border-[#93C5FD] hover:bg-[#F8FBFF]"}`}>
      {iconName && (
        <Icon
          name={iconName}
          className={`w-4 h-4 ${selected ? "text-[#1E3A8A]" : "text-[#94A3B8]"}`}
        />
      )}
      {label}
      {selected && (
        <span className='ml-0.5 w-4 h-4 rounded-full bg-[#1E3A8A] flex items-center justify-center shrink-0'>
          <Icon name='check' className='w-2.5 h-2.5 text-white' />
        </span>
      )}
    </button>
  );
}

function RadioChip({
  label,
  iconName,
  selected,
  onClick,
}: {
  label: string;
  iconName?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl border px-4 py-5 transition-all duration-150
        ${selected ? "border-[#1E3A8A] bg-[#EFF6FF] text-[#1E3A8A]" : "border-[#E2E8F0] bg-white text-[#334155] hover:border-[#93C5FD] hover:bg-[#F8FBFF]"}`}>
      {iconName && (
        <span
          className={`shrink-0 ${selected ? "text-[#1E3A8A]" : "text-[#94A3B8]"}`}>
          <Icon name={iconName} className='w-5 h-5' />
        </span>
      )}
      <span className='font-medium text-sm flex-1 text-left'>{label}</span>
      <span
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "border-[#1E3A8A] bg-[#1E3A8A]" : "border-[#CBD5E1]"}`}>
        {selected && <Icon name='check' className='w-3 h-3 text-white' />}
      </span>
    </button>
  );
}

// Styled native select dropdown
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div>
      <label className='block text-sm font-medium text-[#334155] mb-1.5'>
        {label}
      </label>
      <div className='relative'>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-xl border px-4 py-3 pr-10 text-sm outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 transition cursor-pointer
            ${value ? "border-[#CBD5E1] text-[#0F172A] bg-white" : "border-[#CBD5E1] text-[#94A3B8] bg-white"}`}>
          <option value='' disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <span className='absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B8]'>
          <Icon name='chevron_down' className='w-4 h-4' />
        </span>
      </div>
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className='mb-8'>
      <div className='flex justify-between items-center mb-2'>
        <span className='text-xs font-semibold text-[#3B82F6] uppercase tracking-widest'>
          Step {step} of {total}
        </span>
        <span className='text-xs text-[#94A3B8]'>
          {Math.round((step / total) * 100)}% complete
        </span>
      </div>
      <div className='h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden'>
        <div
          className='h-full bg-gradient-to-r from-[#3B82F6] to-[#1E3A8A] rounded-full transition-all duration-500 ease-out'
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue →",
  nextDisabled = false,
  step,
  total,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  step: number;
  total: number;
}) {
  return (
    <div className='w-full max-w-lg mx-auto'>
      <ProgressBar step={step} total={total} />
      <div className='mb-7'>
        <h2 className='text-2xl font-bold text-[#0F172A] mb-1.5'>{title}</h2>
        {subtitle && (
          <p className='text-[#64748B] text-sm leading-relaxed'>{subtitle}</p>
        )}
      </div>
      <div className='mb-8'>{children}</div>
      <div className='flex gap-3'>
        {onBack && (
          <button
            type='button'
            onClick={onBack}
            className='flex-none rounded-xl border-2 border-[#E2E8F0] bg-white text-[#334155] font-semibold py-3.5 px-5 text-sm hover:bg-[#F8FAFF] hover:border-[#93C5FD] transition'>
            ← Back
          </button>
        )}
        <button
          type='button'
          onClick={onNext}
          disabled={nextDisabled}
          className='flex-1 rounded-xl bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold py-3.5 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-[#1E3A8A]/30'>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Intent
// ─────────────────────────────────────────────────────────────────────────────
const INTENTS = [
  { id: "fun", label: "Fun & good times", iconName: "fun" },
  { id: "relationship", label: "Relationship", iconName: "relationship" },
  { id: "both", label: "Open to both", iconName: "both" },
];

function StepIntent({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onNext: () => void;
}) {
  return (
    <StepShell
      step={1}
      total={TOTAL_STEPS}
      title='What are you here for?'
      subtitle='Helps us show you the right connections. Be honest — no wrong answer.'
      onNext={onNext}
      nextDisabled={data.intent.length === 0}>
      <div className='space-y-3'>
        {INTENTS.map((item) => (
          <RadioChip
            key={item.id}
            label={item.label}
            iconName={item.iconName}
            selected={data.intent.includes(item.id)}
            onClick={() => onChange({ intent: [item.id] })}
          />
        ))}
      </div>
    </StepShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Age  (NEW)
// ─────────────────────────────────────────────────────────────────────────────
function StepAge({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const age = parseInt(data.age, 10);
  const valid = !isNaN(age) && age >= 18 && age <= 80;
  const tooYoung = data.age && age < 18;

  return (
    <StepShell
      step={2}
      total={TOTAL_STEPS}
      title='How old are you?'
      subtitle='You must be 18 or older to use Bluufun. Your age will be shown on your profile.'
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!valid}>
      <div>
        <label className='block text-sm font-medium text-[#334155] mb-1.5'>
          Your age
        </label>
        <div className='relative'>
          <span className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]'>
            <Icon name='age' className='w-4 h-4' />
          </span>
          <input
            type='number'
            min={18}
            max={80}
            value={data.age}
            onChange={(e) => onChange({ age: e.target.value })}
            placeholder='e.g. 24'
            className='w-full rounded-xl border border-[#CBD5E1] bg-white pl-10 pr-4 py-3 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 transition'
          />
        </div>
        {tooYoung && (
          <p className='mt-2 text-sm text-red-500 flex items-center gap-1.5'>
            <svg
              className='w-4 h-4 shrink-0'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            You must be at least 18 years old to join Bluufun.
          </p>
        )}
        {valid && (
          <div className='mt-3 inline-flex items-center gap-2 bg-[#EFF6FF] rounded-full px-3 py-1.5'>
            <Icon name='check' className='w-3.5 h-3.5 text-[#3B82F6]' />
            <span className='text-[#3B82F6] text-xs font-semibold'>
              Age confirmed — {age} years old
            </span>
          </div>
        )}
      </div>
    </StepShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Location (state → LGA only)
// ─────────────────────────────────────────────────────────────────────────────
function StepLocation({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const stateNames = NIGERIA_STATES.map((s) => s.state);
  const lgas = data.state ? getLGAs(data.state) : [];
  const valid = !!data.state && !!data.lga;

  function handleStateChange(state: string) {
    onChange({ state, lga: "" }); // reset LGA when state changes
  }

  return (
    <StepShell
      step={3}
      total={TOTAL_STEPS}
      title='Where are you based?'
      subtitle='Select your state and city. This helps seekers discover you in their city.'
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!valid}>
      <div className='space-y-4'>
        <SelectField
          label='State'
          value={data.state}
          onChange={handleStateChange}
          options={stateNames}
          placeholder='Select your state'
        />
        <SelectField
          label='City'
          value={data.lga}
          onChange={(lga) => onChange({ lga })}
          options={lgas}
          placeholder={data.state ? "Select your city" : "Select a state first"}
        />
      </div>
    </StepShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Education
// ─────────────────────────────────────────────────────────────────────────────
const EDUCATION_LEVELS = [
  { id: "secondary", label: "Secondary School", iconName: "secondary" },
  { id: "diploma", label: "Diploma / OND / HND", iconName: "diploma" },
  { id: "bsc", label: "Bachelor's Degree (BSc)", iconName: "bsc" },
  { id: "msc", label: "Master's Degree (MSc)", iconName: "msc" },
  { id: "phd", label: "PhD / Doctorate", iconName: "phd" },
  { id: "vocational", label: "Vocational Training", iconName: "vocational" },
  { id: "none", label: "Prefer not to say", iconName: "prefer_not" },
];

function StepEducation({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <StepShell
      step={4}
      total={TOTAL_STEPS}
      title='Highest education level?'
      subtitle='Optional — helps people know a bit more about you.'
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!data.education}>
      <div className='space-y-3'>
        {EDUCATION_LEVELS.map((item) => (
          <RadioChip
            key={item.id}
            label={item.label}
            iconName={item.iconName}
            selected={data.education === item.id}
            onClick={() => onChange({ education: item.id })}
          />
        ))}
      </div>
    </StepShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 5 — Occupation
// ─────────────────────────────────────────────────────────────────────────────
const OCCUPATIONS = [
  {
    id: "corporate",
    label: "Corporate / Office worker",
    iconName: "corporate",
  },
  {
    id: "business",
    label: "Business owner / Entrepreneur",
    iconName: "business",
  },
  { id: "corper", label: "NYSC Corper", iconName: "corper" },
  { id: "student", label: "Student", iconName: "student" },
  {
    id: "creative",
    label: "Creative (artist, musician, etc.)",
    iconName: "creative",
  },
  { id: "tech", label: "Tech professional", iconName: "tech" },
  { id: "medical", label: "Medical / Healthcare", iconName: "medical" },
  { id: "handwork", label: "Skilled trade / Handwork", iconName: "handwork" },
  { id: "civil_service", label: "Civil servant", iconName: "civil_service" },
  {
    id: "freelance",
    label: "Freelancer / Self-employed",
    iconName: "freelance",
  },
  { id: "unemployed", label: "Currently unemployed", iconName: "unemployed" },
  { id: "prefer_not", label: "Prefer not to say", iconName: "prefer_not" },
];

function StepOccupation({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <StepShell
      step={5}
      total={TOTAL_STEPS}
      title='What do you do?'
      subtitle='Helps you connect with like-minded people.'
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!data.occupation}>
      <div className='space-y-2.5'>
        {OCCUPATIONS.map((item) => (
          <RadioChip
            key={item.id}
            label={item.label}
            iconName={item.iconName}
            selected={data.occupation === item.id}
            onClick={() => onChange({ occupation: item.id })}
          />
        ))}
      </div>
    </StepShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 6 — Identity
// ─────────────────────────────────────────────────────────────────────────────
const GENDERS = [
  // { id: "male", label: "Male", iconName: "male" },
  { id: "female", label: "Female", iconName: "female" },
  { id: "trans", label: "Transgender", iconName: "trans" },
  { id: "nonbinary", label: "Non-binary", iconName: "nonbinary" },
  { id: "prefer_not", label: "Prefer not to say", iconName: "prefer_not" },
];
const ORIENTATIONS = [
  { id: "straight", label: "Straight / Heterosexual", iconName: "straight" },
  { id: "bisexual", label: "Bisexual", iconName: "bisexual" },
  // { id: "gay", label: "Gay", iconName: "gay" },
  { id: "lesbian", label: "Lesbian", iconName: "lesbian" },
  { id: "prefer_not", label: "Prefer not to say", iconName: "prefer_not" },
];

function StepIdentity({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <StepShell
      step={6}
      total={TOTAL_STEPS}
      title='Your identity'
      subtitle='Kept private unless you choose to share.'
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!data.gender || !data.orientation}>
      <div className='space-y-6'>
        <div>
          <p className='text-sm font-semibold text-[#0F172A] mb-3'>Gender</p>
          <div className='space-y-2.5'>
            {GENDERS.map((item) => (
              <RadioChip
                key={item.id}
                label={item.label}
                iconName={item.iconName}
                selected={data.gender === item.id}
                onClick={() => onChange({ gender: item.id })}
              />
            ))}
          </div>
        </div>
        <div>
          <p className='text-sm font-semibold text-[#0F172A] mb-3'>
            Sexual orientation
          </p>
          <div className='space-y-2.5'>
            {ORIENTATIONS.map((item) => (
              <RadioChip
                key={item.id}
                label={item.label}
                iconName={item.iconName}
                selected={data.orientation === item.id}
                onClick={() => onChange({ orientation: item.id })}
              />
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 7 — Appearance
// ─────────────────────────────────────────────────────────────────────────────
// BODY_TYPES, HEIGHTS, SKIN_TONES, and BUST_SIZES are all imported from
// "@/lib/profileOptions" — the single source of truth shared with the
// dashboard edit modal and every read-only profile display. Do not
// redeclare any of them locally here.

function StepAppearance({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const toggleBodyType = (id: string) => {
    const c = data.bodyType;
    onChange({
      bodyType: c.includes(id) ? c.filter((x) => x !== id) : [...c, id],
    });
  };
  return (
    <StepShell
      step={7}
      total={TOTAL_STEPS}
      title='Describe your appearance'
      subtitle='Select all that apply. Helps your profile feel authentic.'
      onBack={onBack}
      onNext={onNext}
      nextDisabled={data.bodyType.length === 0 || !data.height}>
      <div className='space-y-7'>
        <div>
          <p className='text-sm font-semibold text-[#0F172A] mb-3'>
            Body type{" "}
            <span className='font-normal text-[#94A3B8]'>
              (select all that apply)
            </span>
          </p>
          <div className='flex flex-wrap gap-2'>
            {BODY_TYPES.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                selected={data.bodyType.includes(item.id)}
                onClick={() => toggleBodyType(item.id)}
              />
            ))}
          </div>
        </div>
        <div>
          <p className='text-sm font-semibold text-[#0F172A] mb-3'>Height</p>
          <div className='flex flex-wrap gap-2'>
            {HEIGHTS.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                selected={data.height === item.id}
                onClick={() => onChange({ height: item.id })}
              />
            ))}
          </div>
        </div>
        <div>
          <p className='text-sm font-semibold text-[#0F172A] mb-3'>Skin tone</p>
          <div className='flex flex-wrap gap-2'>
            {SKIN_TONES.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                selected={data.skinTone === item.id}
                onClick={() => onChange({ skinTone: item.id })}
              />
            ))}
          </div>
        </div>
        <div>
          <p className='text-sm font-semibold text-[#0F172A] mb-3'>
            Bust / chest size
          </p>
          <div className='flex flex-wrap gap-2'>
            {BUST_SIZES.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                selected={data.bustSize === item.id}
                onClick={() => onChange({ bustSize: item.id })}
              />
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 8 — Experiences
// ─────────────────────────────────────────────────────────────────────────────
const EXPERIENCES = [
  { id: "fun", label: "Fun & entertainment", iconName: "fun" },
  { id: "party", label: "Party partner", iconName: "party" },
  { id: "clubbing", label: "Clubbing / nightlife", iconName: "clubbing" },
  { id: "travel", label: "Travel companion", iconName: "travel" },
  { id: "date", label: "Date night", iconName: "date" },
  {
    id: "relationship",
    label: "Serious relationship",
    iconName: "relationship",
  },
  { id: "fwb", label: "Friends with benefits", iconName: "fwb" },
  { id: "cook", label: "Good cook", iconName: "cook" },
  { id: "listener", label: "Good listener", iconName: "listener" },
  { id: "advisor", label: "Problem solver", iconName: "advisor" },
  { id: "gym", label: "Gym buddy", iconName: "gym" },
  { id: "movies", label: "Movie partner", iconName: "movies" },
  { id: "gaming", label: "Gaming partner", iconName: "gaming" },
  { id: "outdoor", label: "Outdoor adventures", iconName: "outdoor" },
  { id: "shopping", label: "Shopping partner", iconName: "shopping" },
  { id: "networking", label: "Networking", iconName: "networking" },
  { id: "spiritual", label: "Spiritual partner", iconName: "spiritual" },
  { id: "mentorship", label: "Mentorship", iconName: "mentorship" },
  { id: "luxury_date", label: "Luxury date vibe", iconName: "date" },
  { id: "romance_lover", label: "Romance lover", iconName: "relationship" },
  {
    id: "cuddles_affection",
    label: "Cuddles & affection",
    iconName: "listener",
  },
  {
    id: "kissing_chemistry",
    label: "Kissing and chemistry",
    iconName: "relationship",
  },
  { id: "intimacy_first", label: "Intimacy first", iconName: "fwb" },
  {
    id: "late_night_talker",
    label: "Late-night talker",
    iconName: "conversation",
  },
  { id: "spoil_me_energy", label: "Spoil me energy", iconName: "shopping" },
  { id: "dominant_energy", label: "Dominant energy", iconName: "spontaneous" },
  { id: "no_strings_fun", label: "No-strings fun", iconName: "fun" },
  { id: "fwb_boundaries", label: "FWB with boundaries", iconName: "fwb" },
  {
    id: "bedroom_confidence",
    label: "Bedroom confidence",
    iconName: "spontaneous",
  },
  {
    id: "mature_connection",
    label: "Mature connection",
    iconName: "relationship",
  },
  { id: "private_fun", label: "Private fun", iconName: "spontaneous" },
  {
    id: "roleplay_interested",
    label: "Roleplay interested",
    iconName: "spontaneous",
  },
  { id: "karaoke", label: "Karaoke / music", iconName: "karaoke" },
  { id: "road_trip", label: "Road trips", iconName: "road_trip" },
  { id: "beach", label: "Beach / pool days", iconName: "beach" },
  { id: "conversation", label: "Deep conversation", iconName: "conversation" },
  { id: "spontaneous", label: "Spontaneous plans", iconName: "spontaneous" },
];

function StepExperiences({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const toggle = (id: string) => {
    const c = data.experiences;
    onChange({
      experiences: c.includes(id) ? c.filter((x) => x !== id) : [...c, id],
    });
  };
  return (
    <StepShell
      step={8}
      total={TOTAL_STEPS}
      title='What can you offer?'
      subtitle='Select everything that applies. More picks = better matches.'
      onBack={onBack}
      onNext={onNext}
      nextDisabled={data.experiences.length === 0}
      nextLabel={
        data.experiences.length > 0
          ? `Continue with ${data.experiences.length} selected →`
          : "Select at least one →"
      }>
      {data.experiences.length > 0 && (
        <div className='mb-4 inline-flex items-center gap-2 bg-[#EFF6FF] rounded-full px-3 py-1.5'>
          <span className='text-[#3B82F6] text-xs font-semibold'>
            {data.experiences.length} selected
          </span>
        </div>
      )}
      <div className='flex flex-wrap gap-2'>
        {EXPERIENCES.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            iconName={item.iconName}
            selected={data.experiences.includes(item.id)}
            onClick={() => toggle(item.id)}
          />
        ))}
      </div>
    </StepShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 9 — Current want  (NEW)
// ─────────────────────────────────────────────────────────────────────────────
const CURRENT_WANTS = [
  { id: "just_chilling", label: "Just chilling, no pressure", iconName: "fun" },
  {
    id: "meet_asap",
    label: "Ready to meet someone now",
    iconName: "spontaneous",
  },
  {
    id: "good_convo",
    label: "Looking for good conversation",
    iconName: "conversation",
  },
  { id: "weekend_plan", label: "Need weekend plans", iconName: "party" },
  { id: "travel_buddy", label: "Need a travel buddy", iconName: "travel" },
  { id: "date_night", label: "Planning a date night", iconName: "date" },
  { id: "gym_partner", label: "Want a gym partner", iconName: "gym" },
  { id: "movie_night", label: "Movie night partner", iconName: "movies" },
  {
    id: "emotional_support",
    label: "Need emotional support",
    iconName: "listener",
  },
  {
    id: "networking_now",
    label: "Networking right now",
    iconName: "networking",
  },
  { id: "exploring", label: "Just exploring", iconName: "outdoor" },
  {
    id: "serious_connection",
    label: "Seeking a serious connection",
    iconName: "relationship",
  },
];

function StepCurrentWant({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <StepShell
      step={9}
      total={TOTAL_STEPS}
      title='What do you want right now?'
      subtitle='This updates your profile with your current mood. You can change it anytime from your dashboard.'
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!data.currentWant}>
      <div className='space-y-2.5'>
        {CURRENT_WANTS.map((item) => (
          <RadioChip
            key={item.id}
            label={item.label}
            iconName={item.iconName}
            selected={data.currentWant === item.id}
            onClick={() => onChange({ currentWant: item.id })}
          />
        ))}
      </div>
    </StepShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 10 — Vibe bio  (NEW)
// ─────────────────────────────────────────────────────────────────────────────
const BIO_MAX = 200;

function StepVibeBio({
  data,
  onChange,
  onBack,
  onNext,
}: {
  data: OnboardingData;
  onChange: (d: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const len = data.vibeBio.trim().length;
  const valid = len >= 10;

  return (
    <StepShell
      step={10}
      total={TOTAL_STEPS}
      title='Describe your vibe'
      subtitle='Write a short, honest bio about yourself and the kind of fun you bring. This is the first thing people read.'
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!valid}
      nextLabel='Continue →'>
      <div>
        <label className='block text-sm font-medium text-[#334155] mb-1.5'>
          Your vibe in a few words
        </label>
        <div className='relative'>
          <textarea
            value={data.vibeBio}
            onChange={(e) => {
              if (e.target.value.length <= BIO_MAX)
                onChange({ vibeBio: e.target.value });
            }}
            rows={5}
            placeholder="e.g. I'm the kind of person who turns a regular hangout into a whole experience. I love trying new restaurants, random road trips and deep conversations under the stars. Come vibe with me 😄"
            className='w-full rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-[#0F172A] text-sm placeholder:text-[#94A3B8] outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/15 transition resize-none leading-relaxed'
          />
        </div>
        <div className='flex justify-between items-center mt-2'>
          <span className='text-xs text-[#94A3B8]'>
            {!valid && len > 0
              ? `${10 - len} more characters needed`
              : valid
                ? "Looks great!"
                : "At least 10 characters"}
          </span>
          <span
            className={`text-xs font-medium ${len > BIO_MAX * 0.9 ? "text-orange-500" : "text-[#94A3B8]"}`}>
            {len}/{BIO_MAX}
          </span>
        </div>

        {/* Prompt suggestions */}
        <div className='mt-4'>
          <p className='text-xs font-semibold text-[#334155] mb-2'>
            Need inspiration? Try answering:
          </p>
          <div className='space-y-1.5'>
            {[
              "What makes you a fun person to hang out with?",
              "What's your ideal weekend look like?",
              "What kind of energy do you bring to a group?",
            ].map((prompt) => (
              <div key={prompt} className='flex items-start gap-2'>
                <span className='text-[#3B82F6] mt-0.5 shrink-0'>
                  <svg
                    className='w-3.5 h-3.5'
                    fill='currentColor'
                    viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </span>
                <span className='text-xs text-[#64748B]'>{prompt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 11 — Review
// ─────────────────────────────────────────────────────────────────────────────
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex justify-between items-start py-3 border-b border-[#F1F5F9] last:border-0'>
      <span className='text-sm text-[#64748B] shrink-0 mr-3'>{label}</span>
      <span className='text-sm font-medium text-[#0F172A] text-right'>
        {value || "—"}
      </span>
    </div>
  );
}

function StepBookingRates({ data, onChange, onBack, onNext }: { data: OnboardingData; onChange: (patch: Partial<OnboardingData>) => void; onBack: () => void; onNext: () => void }) {
  const valid = data.bookingRates.length > 0 && data.bookingRates.every((rate) => rate.incall || rate.outcall);
  return <StepShell title='Booking rates' subtitle='Choose the services you offer and set your rates. You can provide incall, outcall, or both.' onBack={onBack} onNext={onNext} nextDisabled={!valid} step={11} total={TOTAL_STEPS}>
    <BookingRatesEditor value={data.bookingRates} onChange={(bookingRates) => onChange({ bookingRates })} />
  </StepShell>;
}

function StepReview({
  data,
  onBack,
  onSubmit,
  loading,
  error,
}: {
  data: OnboardingData;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  error?: string;
}) {
  const maps = {
    intent: {
      fun: "Fun & good times",
      relationship: "Relationship",
      both: "Open to both",
    },
    education: {
      secondary: "Secondary School",
      diploma: "Diploma / HND",
      bsc: "BSc",
      msc: "MSc",
      phd: "PhD",
      vocational: "Vocational",
      none: "Prefer not to say",
    },
    occupation: {
      corporate: "Corporate worker",
      business: "Business owner",
      corper: "NYSC Corper",
      student: "Student",
      creative: "Creative",
      tech: "Tech professional",
      medical: "Healthcare",
      handwork: "Skilled trade",
      civil_service: "Civil servant",
      freelance: "Freelancer",
      unemployed: "Unemployed",
      prefer_not: "Prefer not to say",
    },
    gender: {
      male: "Male",
      female: "Female",
      trans: "Transgender",
      nonbinary: "Non-binary",
      prefer_not: "Prefer not to say",
    },
    orientation: {
      straight: "Straight",
      bisexual: "Bisexual",
      gay: "Gay",
      lesbian: "Lesbian",
      prefer_not: "Prefer not to say",
    },
    skin: {
      fair: "Fair",
      light_brown: "Light Brown",
      brown: "Brown",
      dark: "Dark",
      mixed: "Mixed",
    },
    bust: {
      petite: "Petite (A–B cup)",
      average: "Average (C cup)",
      full: "Full (D–DD cup)",
      voluptuous: "Voluptuous (DDD+ cup)",
    },
    want: {
      just_chilling: "Just chilling",
      meet_asap: "Ready to meet someone",
      good_convo: "Good conversation",
      weekend_plan: "Weekend plans",
      travel_buddy: "Travel buddy",
      date_night: "Date night",
      gym_partner: "Gym partner",
      movie_night: "Movie night",
      emotional_support: "Emotional support",
      networking_now: "Networking",
      exploring: "Just exploring",
      serious_connection: "Serious connection",
    },
  } as Record<string, Record<string, string>>;

  const r = (map: Record<string, string>, id: string) => map[id] ?? id;

  return (
    <StepShell
      step={12}
      total={TOTAL_STEPS}
      title='Looks good?'
      subtitle='Review before we move to photos. You can edit all of this later.'
      onBack={onBack}
      onNext={onSubmit}
      nextLabel={loading ? "Saving…" : "Complete profile →"}
      nextDisabled={loading}>
      {error && <div className='mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700'>{error}</div>}
      <div className='bg-white rounded-2xl border border-[#E2E8F0] px-5 py-1 mb-2'>
        <ReviewRow
          label='Booking rates'
          value={data.bookingRates.length ? `${data.bookingRates.length} duration${data.bookingRates.length === 1 ? "" : "s"} selected` : "—"}
        />
        <ReviewRow
          label='Here for'
          value={data.intent.map((i) => r(maps.intent, i)).join(", ")}
        />
        <ReviewRow
          label='Age'
          value={data.age ? `${data.age} years old` : "—"}
        />
        <ReviewRow
          label='Location'
          value={[data.lga, data.state].filter(Boolean).join(", ")}
        />
        <ReviewRow
          label='Education'
          value={r(maps.education, data.education)}
        />
        <ReviewRow
          label='Occupation'
          value={r(maps.occupation, data.occupation)}
        />
        <ReviewRow label='Gender' value={r(maps.gender, data.gender)} />
        <ReviewRow
          label='Orientation'
          value={r(maps.orientation, data.orientation)}
        />
        <ReviewRow
          label='Body type'
          value={data.bodyType
            .map((b) => BODY_TYPES.find((x) => x.id === b)?.label ?? b)
            .join(", ")}
        />
        <ReviewRow
          label='Height'
          value={HEIGHTS.find((x) => x.id === data.height)?.label ?? "—"}
        />
        <ReviewRow label='Skin tone' value={r(maps.skin, data.skinTone)} />
        <ReviewRow label='Bust size' value={r(maps.bust, data.bustSize)} />
        <ReviewRow
          label={`Experiences (${data.experiences.length})`}
          value={
            data.experiences
              .slice(0, 4)
              .map((e) => EXPERIENCES.find((x) => x.id === e)?.label ?? e)
              .join(", ") +
            (data.experiences.length > 4
              ? ` +${data.experiences.length - 4} more`
              : "")
          }
        />
        <ReviewRow label='Right now' value={r(maps.want, data.currentWant)} />
        <ReviewRow
          label='Vibe bio'
          value={
            data.vibeBio.length > 60
              ? data.vibeBio.slice(0, 60) + "…"
              : data.vibeBio
          }
        />
      </div>
      <p className='text-xs text-[#94A3B8] text-center mt-3'>
        Next step: add your photos and videos.
      </p>
    </StepShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL: OnboardingData = {
  intent: [],
  age: "",
  state: "",
  lga: "",
  country: "Nigeria",
  education: "",
  occupation: "",
  gender: "",
  orientation: "",
  bodyType: [],
  height: "",
  skinTone: "",
  bustSize: "",
  experiences: [],
  currentWant: "",
  vibeBio: "",
  bookingRates: [],
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const clampStep = (n: number) => Math.min(12, Math.max(1, n));

function FunmateOnboardingInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, setUser } = useAuth();
  const [data, setData] = useState<OnboardingData>(INITIAL);
  // Gates localStorage writes until restoration has been attempted — see
  // the restore effect below for why this matters.
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const draftKey = user?.id ? `bf_onboarding_funmate_draft:${user.id}` : null;

  // The URL is the source of truth for which step we're on. This means a
  // page reload knows the step synchronously on first render (no flash of
  // step 1) and the browser back/forward buttons move between steps.
  const stepParam = Number(searchParams.get("step"));
  const step =
    Number.isFinite(stepParam) && stepParam > 0 ? clampStep(stepParam) : 1;

  const routeDecision =
    !authLoading && user
      ? getProtectedRouteDecision("/onboarding/funmate", user)
      : null;
  const redirectTo = routeDecision?.redirectTo ?? null;
  const shouldHoldForRedirect = Boolean(redirectTo && redirectTo !== pathname);

  const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

  useIsomorphicLayoutEffect(() => {
    if (authLoading || !routeDecision?.redirectTo) return;
    router.replace(routeDecision.redirectTo);
  }, [authLoading, routeDecision?.redirectTo, router]);

  const goTo = (n: number) => {
    router.push(`${pathname}?step=${clampStep(n)}`, { scroll: false });
  };

  // Restore saved answers (and, if the URL doesn't already carry a step —
  // e.g. someone opened a bare /onboarding/funmate link — the step too)
  // from localStorage. Runs once per draftKey.
  useEffect(() => {
    if (!draftKey || typeof window === "undefined") {
      setTimeout(() => setHydrated(true), 0);
      return;
    }

    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          step?: number;
          data?: Partial<OnboardingData>;
        };
        if (parsed.data) {
          setTimeout(
            () => setData((prev) => ({ ...prev, ...parsed.data })),
            0
          );
        }
        if (!searchParams.get("step") && typeof parsed.step === "number") {
          router.replace(`${pathname}?step=${clampStep(parsed.step)}`, {
            scroll: false,
          });
        }
      } catch {
        // ignore bad draft data
      }
    }

    setTimeout(() => setHydrated(true), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Persist on every change — but only once restoration above has had a
  // chance to run. Without the `hydrated` gate, this effect fires on mount
  // with the still-empty initial state and overwrites the saved draft
  // before the restore effect's setData/setStep calls land, permanently
  // wiping progress (this was the cause of reloads bouncing back to step 1).
  useEffect(() => {
    if (!hydrated || !draftKey || typeof window === "undefined") return;
    localStorage.setItem(draftKey, JSON.stringify({ step, data }));
  }, [data, draftKey, step, hydrated]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const update = (patch: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...patch }));
  const next = () => goTo(step + 1);
  const back = () => goTo(step - 1);

  if (authLoading || !user || shouldHoldForRedirect) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F8FAFF] px-4'>
        <div className='rounded-[2rem] border border-white/70 bg-white/90 px-6 py-5 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent' />
        </div>
      </div>
    );
  }

  async function submitProfile() {
    const missing: string[] = [];
    if (!user?.whatsapp?.trim()) missing.push("WhatsApp number");
    if (!data.intent.length) missing.push("what you are looking for");
    if (!data.age) missing.push("age");
    if (!data.state || !data.lga) missing.push("location");
    if (!data.education) missing.push("education");
    if (!data.occupation) missing.push("occupation");
    if (!data.gender) missing.push("gender");
    if (!data.orientation) missing.push("orientation");
    if (!data.bodyType.length) missing.push("body type");
    if (!data.height || !data.skinTone || !data.bustSize) missing.push("appearance details");
    if (!data.experiences.length) missing.push("experiences");
    if (!data.currentWant) missing.push("what you want right now");
    if (!data.vibeBio.trim()) missing.push("vibe bio");
    if (!data.bookingRates.length || data.bookingRates.some((rate) => !rate.incall && !rate.outcall)) missing.push("booking rates");
    if (missing.length) {
      setSubmitError(`Please complete: ${missing.join(", ")}.`);
      return;
    }
    setSubmitError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/users/me/funmate-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bf_token")}`,
        },
        body: JSON.stringify({ ...data, whatsapp: user?.whatsapp || "", role: "funmate" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          friendlyApiMessage(
            err.message,
            "We couldn't save your profile right now.",
          ),
        );
      }

      const { user: updatedUser } = await res.json();
      if (updatedUser) {
        invalidateUserEverywhere(updatedUser.username);
        setUser(updatedUser);
        if (draftKey) localStorage.removeItem(draftKey);
      }

      setLoading(false);
      router.push("/upload-gallery");
    } catch (err) {
      setLoading(false);
      alert(friendlyApiError(err, "We couldn't save your profile right now."));
    }
  }

  function handleMediaDone(_keys: string[]) {
    // router.push("/dashboard?welcome=1");
    router.push("/verification");
  }

  return (
    <div className='min-h-[90vh] bg-[#F8FAFF] flex items-start justify-center px-4 py-10'>
      <div className='w-full max-w-lg'>
        {step === 1 && (
          <StepIntent data={data} onChange={update} onNext={next} />
        )}
        {step === 2 && (
          <StepAge data={data} onChange={update} onBack={back} onNext={next} />
        )}
        {step === 3 && (
          <StepLocation
            data={data}
            onChange={update}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 4 && (
          <StepEducation
            data={data}
            onChange={update}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 5 && (
          <StepOccupation
            data={data}
            onChange={update}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 6 && (
          <StepIdentity
            data={data}
            onChange={update}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 7 && (
          <StepAppearance
            data={data}
            onChange={update}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 8 && (
          <StepExperiences
            data={data}
            onChange={update}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 9 && (
          <StepCurrentWant
            data={data}
            onChange={update}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 10 && (
          <StepVibeBio
            data={data}
            onChange={update}
            onBack={back}
            onNext={next}
          />
        )}
        {step === 11 && <StepBookingRates data={data} onChange={update} onBack={back} onNext={next} />}
        {step === 12 && (
          <StepReview
            data={data}
            onBack={back}
            onSubmit={submitProfile}
            loading={loading}
            error={submitError}
          />
        )}
        {/* {step === 12 && <StepMedia       onBack={() => setStep(11)} onNext={handleMediaDone} />} */}
      </div>
    </div>
  );
}

export default function FunmateOnboarding() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center bg-[#F8FAFF] px-4'>
          <div className='rounded-[2rem] border border-white/70 bg-white/90 px-6 py-5 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-[#1E3A8A] border-t-transparent' />
          </div>
        </div>
      }>
      <FunmateOnboardingInner />
    </Suspense>
  );
}
