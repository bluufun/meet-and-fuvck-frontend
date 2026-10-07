"use client";

import TierChip from "@/components/TierBadge";
import type { BoostTier } from "@/lib/boostTiers";

export default function TierRibbon({ tier }: { tier: BoostTier }) {
  if (tier === "regular") return null;
  return <TierChip tier={tier} size='lg' variant='light' />;
}
