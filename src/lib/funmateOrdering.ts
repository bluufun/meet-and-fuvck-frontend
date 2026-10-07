export type BoostTier = "regular" | "fresher" | "elite" | "elite_plus";

export type RankedFunmate = {
  _id: string;
  boostTier?: BoostTier;
};

const TIER_ORDER: BoostTier[] = ["elite_plus", "elite", "fresher", "regular"];
export const FUNMATE_SHUFFLE_WINDOW_HOURS = 6;

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getShuffleBucket(windowHours = FUNMATE_SHUFFLE_WINDOW_HOURS) {
  const safeHours = Math.max(1, Math.floor(windowHours));
  const bucketMs = safeHours * 60 * 60 * 1000;
  return Math.floor(Date.now() / bucketMs);
}

// Deterministic per-item rank: depends only on (seedKey, windowBucket, tier, _id).
// Never depends on array length or position, so appending pages via pagination
// can never reshuffle items that are already on screen.
function stableRankFor(id: string, seedKey: string) {
  return hashString(`${seedKey}:${id}`);
}

export function orderFunmatesByTier<T extends RankedFunmate>(
  funmates: T[],
  seedKey: string,
  windowHours = FUNMATE_SHUFFLE_WINDOW_HOURS,
) {
  const grouped = new Map<BoostTier, T[]>();
  for (const tier of TIER_ORDER) grouped.set(tier, []);

  for (const funmate of funmates) {
    const tier = funmate.boostTier ?? "regular";
    grouped.get(tier)?.push(funmate);
  }

  const bucket = getShuffleBucket(windowHours);

  return TIER_ORDER.flatMap((tier) => {
    const items = grouped.get(tier) || [];
    const withRank = items.map((item) => ({
      item,
      rank: stableRankFor(item._id, `${seedKey}:${tier}:${bucket}`),
    }));
    withRank.sort((a, b) => a.rank - b.rank);
    return withRank.map((entry) => entry.item);
  });
}