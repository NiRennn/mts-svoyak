export type PreloadImageResult = {
  src: string;
  ok: boolean;
  error?: unknown;
};

// Persistent in-memory cache to prevent garbage collection and eliminate re-decoding
export const imageMemoryCache = new Map<string, HTMLImageElement>();

const CACHE_STORAGE_NAME = "mts-svoyak-v1";

/**
 * Attempts to persist the image in the browser's CacheStorage and HTTP cache
 * so subsequent page opens / sessions in Telegram WebApp load instantly from disk.
 */
const cacheInStorage = async (src: string): Promise<void> => {
  if (
    typeof window === "undefined" ||
    !src ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  ) {
    return;
  }

  // 1. Try CacheStorage API
  if ("caches" in window) {
    try {
      const cache = await caches.open(CACHE_STORAGE_NAME);
      const matched = await cache.match(src);
      if (!matched) {
        await cache.add(src);
        return;
      }
    } catch {
      // Ignore CacheStorage errors (e.g. unsupported scheme, opaque responses)
    }
  }

  // 2. Fallback to fetch with force-cache
  try {
    await fetch(src, { cache: "force-cache" });
  } catch {
    // Ignore network error in background cache
  }
};

/**
 * Loads an image via HTMLImageElement and triggers rasterization/decoding
 * directly into GPU/memory so it's ready for immediate render.
 */
const loadImageElement = (src: string, timeoutMs = 8000): Promise<boolean> => {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    const timer = window.setTimeout(() => {
      finish(false);
    }, timeoutMs);

    const img = new Image();

    img.onload = async () => {
      window.clearTimeout(timer);
      imageMemoryCache.set(src, img);

      if (typeof img.decode === "function") {
        try {
          await img.decode();
        } catch {
          // Decode error (e.g. SVGs without dimensions), image is still loaded
        }
      }

      finish(true);
    };

    img.onerror = () => {
      window.clearTimeout(timer);
      finish(false);
    };

    img.src = src;

    // In case the image is already cached synchronously
    if (img.complete && img.naturalWidth > 0) {
      window.clearTimeout(timer);
      imageMemoryCache.set(src, img);
      if (typeof img.decode === "function") {
        img
          .decode()
          .catch(() => {})
          .finally(() => finish(true));
      } else {
        finish(true);
      }
    }
  });
};

export const preloadImageSrc = async (
  src: string,
  timeoutMs = 8000,
): Promise<PreloadImageResult> => {
  if (!src) {
    return {
      src,
      ok: false,
      error: "Empty image src",
    };
  }

  // Already cached and decoded in memory
  if (imageMemoryCache.has(src)) {
    return {
      src,
      ok: true,
    };
  }

  // Persist in CacheStorage / HTTP cache in background
  cacheInStorage(src).catch(() => {});

  try {
    const ok = await loadImageElement(src, timeoutMs);
    return {
      src,
      ok,
      ...(ok ? {} : { error: "Failed to load or decode image" }),
    };
  } catch (error) {
    return {
      src,
      ok: false,
      error,
    };
  }
};

export const preloadImageSrcs = async (
  srcs: string[],
): Promise<PreloadImageResult[]> => {
  const uniqueSrcs = Array.from(new Set(srcs.filter(Boolean)));

  return Promise.all(uniqueSrcs.map((src) => preloadImageSrc(src)));
};