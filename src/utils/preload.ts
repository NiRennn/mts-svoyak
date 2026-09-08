export type PreloadImageResult = {
  src: string;
  ok: boolean;
  error?: unknown;
};

export const preloadImageSrc = (src: string): Promise<PreloadImageResult> => {
  return new Promise((resolve) => {
    if (!src) {
      resolve({
        src,
        ok: false,
        error: "Empty image src",
      });

      return;
    }

    const img = new Image();

    img.onload = () => {
      resolve({
        src,
        ok: true,
      });
    };

    img.onerror = (error) => {
      resolve({
        src,
        ok: false,
        error,
      });
    };

    img.src = src;
  });
};

export const preloadImageSrcs = async (
  srcs: string[],
): Promise<PreloadImageResult[]> => {
  const uniqueSrcs = Array.from(new Set(srcs));

  return Promise.all(uniqueSrcs.map(preloadImageSrc));
};