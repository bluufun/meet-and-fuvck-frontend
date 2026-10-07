// Mirrors the extension-check already used in CardCarousel.tsx (kept as a
// small standalone copy rather than a shared import, so this file has zero
// risk of affecting the landing page's existing swipe-carousel behavior).
export function isVideoUrl(url: string): boolean {
  const clean = url.split("?")[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v)$/i.test(clean);
}

export type CoverMedia = {
  url: string;
  isVideo: boolean;
};

// Picks a stable "cover" media item for browse contexts (Discover's grid and
// spotlight carousel) where only one static visual can be shown per card.
//
// Always prefers the first IMAGE in upload order — deterministic and stable
// across reloads (unlike a random pick, which would make a funmate visually
// unrecognizable session to session). Only falls back to the first video if
// a funmate genuinely has no images at all, so every funmate still gets a
// real visual either way.
export function getCoverMedia(urls: string[] | undefined | null): CoverMedia | null {
  const list = (urls || []).filter(Boolean);
  if (list.length === 0) return null;

  const firstImage = list.find((url) => !isVideoUrl(url));
  if (firstImage) return { url: firstImage, isVideo: false };

  return { url: list[0], isVideo: true };
}