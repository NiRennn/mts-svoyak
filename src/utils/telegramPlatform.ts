export const isMobileTelegram = (): boolean => {
  const tg = (window as any)?.Telegram?.WebApp;
  const platform: string | undefined = tg?.platform;
  if (
    platform === "android" ||
    platform === "ios" ||
    platform === "android_x" ||
    platform === "unigram"
  ) {
    return true;
  }
  if (
    platform === "tdesktop" ||
    platform === "weba" ||
    platform === "webk" ||
    platform === "macos"
  ) {
    return false;
  }
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const initTelegramPlatformAndSafeArea = () => {
  const tg = (window as any)?.Telegram?.WebApp;

  const updatePlatformAndInsets = () => {
    const isNowMobile = isMobileTelegram();
    document.documentElement.setAttribute(
      "data-platform",
      isNowMobile ? "mobile" : "desktop"
    );
    document.body.setAttribute(
      "data-platform",
      isNowMobile ? "mobile" : "desktop"
    );

    let safeTop = 0;
    let contentTop = 0;

    if (tg?.safeAreaInset && typeof tg.safeAreaInset.top === "number") {
      safeTop = tg.safeAreaInset.top;
      document.documentElement.style.setProperty(
        "--tg-safe-area-inset-top",
        `${safeTop}px`
      );
    }
    if (
      tg?.contentSafeAreaInset &&
      typeof tg.contentSafeAreaInset.top === "number"
    ) {
      contentTop = tg.contentSafeAreaInset.top;
      document.documentElement.style.setProperty(
        "--tg-content-safe-area-inset-top",
        `${contentTop}px`
      );
    }

    // Default fallback height for Telegram header buttons on mobile if not set
    if (isNowMobile && contentTop === 0) {
      contentTop = 50;
    }

    const headerCenterY = safeTop + contentTop / 2;
    document.documentElement.style.setProperty(
      "--tg-header-center-y",
      `${headerCenterY}px`
    );
  };

  updatePlatformAndInsets();

  try {
    tg?.onEvent?.("safeAreaChanged", updatePlatformAndInsets);
    tg?.onEvent?.("contentSafeAreaChanged", updatePlatformAndInsets);
    window.addEventListener("resize", updatePlatformAndInsets);
  } catch (e) {}
};
