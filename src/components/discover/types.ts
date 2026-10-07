import type { BoostTier } from "@/lib/boostTiers";

export interface DiscoverFunmate {
  _id: string;
  name: string;
  username: string;
  age?: number;
  lga?: string;
  city?: string;
  state?: string;
  boostTier: BoostTier;
  isVerified?: boolean;
  mediaUrls: string[];
  experiences?: string[];
  vibeBio?: string;
  currentWant?: string;
  gender?: string;
  orientation?: string;
  intent?: string[];
  profileViews?: number;
}
