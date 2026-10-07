export type BoostTier = "regular" | "fresher" | "elite" | "elite_plus";

export type MediaQuota = {
  photos: number;
  videos: number;
};

export const TIER_META: Record<
  BoostTier,
  {
    label: string;
    coins: number;
    gradient: string;
    overlayGradient: string;
    textColor: string;
  }
> = {
  regular: {
    label: "Regular",
    coins: 0,
    gradient: "from-[#94A3B8] to-[#64748B]",
    overlayGradient: "from-[#94A3B8] to-[#64748B]",
    textColor: "text-white",
  },
  fresher: {
    label: "Fresher",
    coins: 25,
    gradient: "from-[#3B82F6] to-[#2563EB]",
    overlayGradient: "from-[#3B82F6] to-[#2563EB]",
    textColor: "text-white",
  },
  elite: {
    label: "Elite",
    coins: 50,
    gradient: "from-[#F59E0B] to-[#D97706]",
    overlayGradient: "from-[#E23B3B] to-[#A81818]",
    textColor: "text-white",
  },
  elite_plus: {
    label: "Elite Plus",
    coins: 100,
    gradient: "from-[#F5C542] to-[#C98A0B]",
    overlayGradient: "from-[#E8BC3E] to-[#C48A12]",
    textColor: "text-white",
  },
};

export const isGoldTier = (tier?: BoostTier) =>
  tier === "elite" || tier === "elite_plus";

export const MEDIA_QUOTA_BY_TIER: Record<BoostTier, MediaQuota> = {
  regular: { photos: 3, videos: 1 },
  fresher: { photos: 4, videos: 2 },
  elite: { photos: 5, videos: 3 },
  elite_plus: { photos: 5, videos: 3 },
};

export const MEDIA_LIMIT_BY_TIER: Record<BoostTier, number> = {
  regular:
    MEDIA_QUOTA_BY_TIER.regular.photos + MEDIA_QUOTA_BY_TIER.regular.videos,
  fresher:
    MEDIA_QUOTA_BY_TIER.fresher.photos + MEDIA_QUOTA_BY_TIER.fresher.videos,
  elite: MEDIA_QUOTA_BY_TIER.elite.photos + MEDIA_QUOTA_BY_TIER.elite.videos,
  elite_plus:
    MEDIA_QUOTA_BY_TIER.elite_plus.photos +
    MEDIA_QUOTA_BY_TIER.elite_plus.videos,
};

export function getMediaLimit(boostTier?: string | null): number {
  const tier = boostTier as BoostTier | undefined;
  return MEDIA_LIMIT_BY_TIER[tier ?? "regular"] ?? MEDIA_LIMIT_BY_TIER.regular;
}

export function getMediaQuota(boostTier?: string | null): MediaQuota {
  const tier = boostTier as BoostTier | undefined;
  return MEDIA_QUOTA_BY_TIER[tier ?? "regular"] ?? MEDIA_QUOTA_BY_TIER.regular;
}

export const MEDIA_LIMIT_DISPLAY = [
  { label: "Regular", ...MEDIA_QUOTA_BY_TIER.regular },
  { label: "Fresher", ...MEDIA_QUOTA_BY_TIER.fresher },
  { label: "Elite", ...MEDIA_QUOTA_BY_TIER.elite },
  { label: "Elite Plus", ...MEDIA_QUOTA_BY_TIER.elite_plus },
];
