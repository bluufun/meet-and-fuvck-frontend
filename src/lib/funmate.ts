import { cache } from "react";
import type { BoostTier } from "@/lib/boostTiers";
import type { BookingRate } from "@/lib/bookingRates";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface FunmateDetail {
  _id: string;
  name: string;
  username: string;
  age?: number;
  lga?: string;
  state?: string;
  boostTier: BoostTier;
  isVerified?: boolean;
  mediaUrls: string[];
  profileMediaUrls?: string[];
  profileMedia?: string[];
  media?: Array<string | { url?: string; mediaUrl?: string; src?: string }>;
  experiences?: string[];
  vibeBio?: string;
  currentWant?: string;
  education?: string;
  occupation?: string;
  gender?: string;
  orientation?: string;
  bodyType?: string[];
  height?: string;
  skinTone?: string;
  bustSize?: string;
  intent?: string[];
  whatsapp?: string | null;
  whatsappUnlocked?: boolean;
  whatsappUnlockPriceNgn?: number | null;
  profileViews?: number;
  bookingRates?: BookingRate[];
}

export function normalizeMediaUrls(funmate: Partial<FunmateDetail>) {
  const candidates = [
    funmate.mediaUrls,
    funmate.profileMediaUrls,
    funmate.profileMedia,
    funmate.media,
  ];

  const urls = candidates.flatMap((value) => {
    if (!Array.isArray(value)) return [];

    return value.flatMap((item) => {
      if (typeof item === "string") return item;
      return item.url ?? item.mediaUrl ?? item.src ?? [];
    });
  });

  return Array.from(
    new Set(
      urls
        .map((url) => url.trim())
        .filter((url) => /^(https?:|data:|blob:|\/)/i.test(url)),
    ),
  );
}

export type FunmateLookupResult =
  | { status: "found"; funmate: FunmateDetail }
  | { status: "not-found" }
  | { status: "error"; error: string };

export const getFunmateByUsername = cache(
  async (username: string): Promise<FunmateLookupResult> => {
    if (!username) return { status: "not-found" };

    try {
      const res = await fetch(
        `${API}/api/funmates/${encodeURIComponent(username)}`,
        {
          cache: "no-store",
        },
      );

      if (res.status === 404) return { status: "not-found" };
      if (!res.ok) {
        return { status: "error", error: `HTTP ${res.status}` };
      }

      const data = await res.json();
      const incoming = data.funmate as FunmateDetail | undefined;
      if (!incoming)
        return { status: "error", error: "Malformed funmate payload" };

      return {
        status: "found",
        funmate: {
          ...incoming,
          mediaUrls: normalizeMediaUrls(incoming),
        },
      };
    } catch {
      return { status: "error", error: "Network error" };
    }
  },
);
