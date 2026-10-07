"use client";

type Listener = () => void;

const MAX_PRELOADED_IMAGES = 60;
const MAX_PRELOADED_VIDEOS = 8;

function normalizeUrl(url: string) {
  return url.trim();
}

class MediaCacheStore {
  private videoBlobs = new Map<string, string>();
  private videoLoadedAt = new Map<string, number>();
  private loadingVideos = new Set<string>();
  private preloadedImages = new Map<string, number>();
  private listeners = new Set<Listener>();

  subscribe(cb: Listener) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private pruneImages() {
    if (this.preloadedImages.size <= MAX_PRELOADED_IMAGES) return;

    const excess = this.preloadedImages.size - MAX_PRELOADED_IMAGES;
    const oldest = Array.from(this.preloadedImages.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, excess);

    oldest.forEach(([url]) => {
      this.preloadedImages.delete(url);
    });
  }

  private pruneVideos() {
    if (this.videoBlobs.size <= MAX_PRELOADED_VIDEOS) return;

    const excess = this.videoBlobs.size - MAX_PRELOADED_VIDEOS;
    const oldest = Array.from(this.videoLoadedAt.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, excess);

    oldest.forEach(([url]) => {
      const blobUrl = this.videoBlobs.get(url);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        this.videoBlobs.delete(url);
      }
      this.videoLoadedAt.delete(url);
    });
  }

  preloadImage(url: string) {
    const normalized = normalizeUrl(url);
    if (!normalized || this.preloadedImages.has(normalized)) return;
    const img = new Image();
    img.onload = () => {
      this.preloadedImages.set(normalized, Date.now());
      this.pruneImages();
      this.notify();
    };
    img.src = normalized; // warms the browser cache without storing the bytes here
  }

  isVideoCached(url: string) {
    return this.videoBlobs.has(normalizeUrl(url));
  }

  getVideoSrc(url: string): string {
    const normalized = normalizeUrl(url);
    return this.videoBlobs.get(normalized) ?? normalized;
  }

  async preloadVideo(url: string) {
    const normalized = normalizeUrl(url);
    if (!normalized || this.videoBlobs.has(normalized) || this.loadingVideos.has(normalized)) return;
    this.loadingVideos.add(normalized);
    try {
      const res = await fetch(normalized);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      this.videoBlobs.set(normalized, blobUrl);
      this.videoLoadedAt.set(normalized, Date.now());
      this.pruneVideos();
      this.notify();
    } catch {
      // Silently ignore failures. The component keeps using the live URL.
    } finally {
      this.loadingVideos.delete(normalized);
    }
  }

  preloadAll(urls: string[], isVideoFn: (u: string) => boolean) {
    Array.from(new Set(urls.map(normalizeUrl).filter(Boolean))).forEach((u) =>
      isVideoFn(u) ? this.preloadVideo(u) : this.preloadImage(u),
    );
  }

  releaseImages(urls: string[]) {
    urls.forEach((u) => {
      this.preloadedImages.delete(normalizeUrl(u));
    });
  }

  releaseVideos(urls: string[]) {
    urls.forEach((u) => {
      const normalized = normalizeUrl(u);
      const blobUrl = this.videoBlobs.get(normalized);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        this.videoBlobs.delete(normalized);
      }
      this.videoLoadedAt.delete(normalized);
    });
  }

  releaseMedia(urls: string[]) {
    this.releaseImages(urls);
    this.releaseVideos(urls);
  }
}

export const mediaCache = new MediaCacheStore();
