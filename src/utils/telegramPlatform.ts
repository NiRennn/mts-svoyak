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
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    window.innerWidth <= 600
  );
};

export const initTelegramPlatformAndSafeArea = () => {
  const tg = (window as any)?.Telegram?.WebApp;

  const updatePlatformAndInsets = () => {
    const isNowMobile = isMobileTelegram();
    const platform = tg?.platform;
    const isIOS = platform === "ios";

    document.documentElement.setAttribute(
      "data-platform",
      isNowMobile ? "mobile" : "desktop"
    );
    if (document.body) {
      document.body.setAttribute(
        "data-platform",
        isNowMobile ? "mobile" : "desktop"
      );

      if (isNowMobile) {
        document.body.classList.add("is-mobile");
        document.body.classList.remove("is-desktop");
      } else {
        document.body.classList.add("is-desktop");
        document.body.classList.remove("is-mobile");
      }
    }

    let safeTop = 0;
    let contentTop = 0;

    if (
      tg?.safeAreaInset &&
      typeof tg.safeAreaInset.top === "number" &&
      tg.safeAreaInset.top > 0
    ) {
      safeTop = tg.safeAreaInset.top;
    } else if (isNowMobile) {
      safeTop = isIOS ? 44 : 30;
    }

    if (
      tg?.contentSafeAreaInset &&
      typeof tg.contentSafeAreaInset.top === "number" &&
      tg.contentSafeAreaInset.top > 0
    ) {
      contentTop = tg.contentSafeAreaInset.top;
    } else if (isNowMobile) {
      contentTop = isIOS ? 44 : 56;
    }

    const headerCenterY = isNowMobile ? safeTop + contentTop / 2 : 0;

    document.documentElement.style.setProperty(
      "--tg-safe-area-inset-top",
      `${safeTop}px`
    );
    document.documentElement.style.setProperty(
      "--tg-content-safe-area-inset-top",
      `${contentTop}px`
    );
    document.documentElement.style.setProperty(
      "--tg-header-center-y",
      `${headerCenterY}px`
    );

    if (document.body) {
      document.body.style.setProperty(
        "--tg-safe-area-inset-top",
        `${safeTop}px`
      );
      document.body.style.setProperty(
        "--tg-content-safe-area-inset-top",
        `${contentTop}px`
      );
      document.body.style.setProperty(
        "--tg-header-center-y",
        `${headerCenterY}px`
      );
    }
  };

  updatePlatformAndInsets();

  try {
    tg?.onEvent?.("safeAreaChanged", updatePlatformAndInsets);
    tg?.onEvent?.("contentSafeAreaChanged", updatePlatformAndInsets);
    window.addEventListener("resize", updatePlatformAndInsets);
  } catch (e) {}
};
