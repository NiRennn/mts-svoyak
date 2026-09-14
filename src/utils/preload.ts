export type PreloadImageResult = {
  src: string;
  ok: boolean;
  error?: unknown;
};

// Persistent in-memory cache to keep decoded images pinned in memory
export const imageMemoryCache = new Map<string, HTMLImageElement>();

// Active in-flight promises to prevent duplicate concurrent network requests
const promiseCache = new Map<string, Promise<PreloadImageResult>>();

export const preloadImageSrc = (
  src: string,
  timeoutMs = 7000,
): Promise<PreloadImageResult> => {
  if (!src) {
    return Promise.resolve({
      src,
      ok: false,
      error: "Empty image src",
    });
  }

  // If already loaded and decoded into memory
  if (imageMemoryCache.has(src)) {
    return Promise.resolve({
      src,
      ok: true,
    });
  }

  // If already in-flight, return the existing promise
  if (promiseCache.has(src)) {
    return promiseCache.get(src)!;
  }

  const promise = new Promise<PreloadImageResult>((resolve) => {
    let settled = false;

    const finish = (ok: boolean, error?: unknown) => {
      if (settled) return;
      settled = true;
      if (timer) window.clearTimeout(timer);
      promiseCache.delete(src);
      resolve({ src, ok, error });
    };

    const timer = window.setTimeout(() => {
      finish(false, new Error("Preload timeout"));
    }, timeoutMs);

    const img = new Image();

    const handleLoaded = async () => {
      imageMemoryCache.set(src, img);
      if (typeof img.decode === "function") {
        try {
          await img.decode();
        } catch {
          // Decode error (e.g. SVGs without dimensions or already rendered), image is still valid
        }
      }
      finish(true);
    };

    img.onload = handleLoaded;
    img.onerror = (e) => finish(false, e);

    img.src = src;

    // Check if browser resolved it synchronously from disk/memory cache
    if (img.complete && img.naturalWidth > 0) {
      handleLoaded();
    }
  });

  promiseCache.set(src, promise);
  return promise;
};

/**
 * Preloads images with a controlled concurrency limit (default 6)
 * to avoid congesting mobile WebView HTTP connection pools.
 */
export const preloadImageSrcs = async (
  srcs: string[],
  concurrency = 6,
): Promise<PreloadImageResult[]> => {
  const uniqueSrcs = Array.from(new Set(srcs.filter(Boolean)));
  if (!uniqueSrcs.length) return [];

  const results: PreloadImageResult[] = [];
  let index = 0;

  const worker = async () => {
    while (index < uniqueSrcs.length) {
      const current = uniqueSrcs[index++];
      try {
        const res = await preloadImageSrc(current);
        results.push(res);
      } catch (err) {
        results.push({ src: current, ok: false, error: err });
      }
    }
  };

  const workerCount = Math.min(concurrency, uniqueSrcs.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  return results;
};