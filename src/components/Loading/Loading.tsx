import "./Loading.scss";
import { useEffect } from "react";
import appRoutes from "../../routes/routes";
import { useNavigate } from "react-router-dom";
import { fetchAndHydrateUserData } from "../../api/userData";
import logo from "../../assets/icons/mts-logo.svg";
import Loader from "../Loader/Loader";
import type { GetUserDataResponse } from "../../store/appStore";
import { preloadImageSrcs } from "../../utils/preload";
import { APP_PRELOAD_IMAGES } from "../../data/preloadImages";

// import kov from "../../assets/images/loader-kov.png";
import svoyak from '../../assets/images/logo-top.png'

import {
  getEffectiveUserId,
  getTelegramInitData,
} from "../../api/telegramAuth";
import {
  initTelegramPlatformAndSafeArea,
  isMobileTelegram,
} from "../../utils/telegramPlatform";

const MIN_LOADING_DELAY = 3000;

const delay = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

function Loading() {
  const isMobile = isMobileTelegram();
  const navigate = useNavigate();

  const pickNextRoute = (userData: GetUserDataResponse) => {
    if (Array.isArray(userData.winners) && userData.winners.length > 0) {
      return appRoutes.END;
    }

    const qualifyThreshold = userData.qualify_threshold ?? 2000;
    // const bestPoints = userData.best_points ?? 0;
    const attemptPoints = userData.attempt?.total_points ?? 0;
    const answeredCount =
      userData.answered_question_ids?.length ??
      userData.attempt?.answered_count ??
      0;
    const isCurrentAttemptFinished =
      Boolean(userData.attempt?.is_finished) || answeredCount >= 75;

    // Count how many attempts are finished and qualified (>= qualifyThreshold or > 2000)
    const successfulAttemptNos = new Set<number>();
    let unnumberedCount = 0;
    if (Array.isArray(userData.attempts)) {
      for (const a of userData.attempts) {
        if (
          Boolean(a.is_finished) &&
          ((a.total_points ?? 0) >= qualifyThreshold || (a.total_points ?? 0) > 2000)
        ) {
          if (typeof a.attempt_no === "number") {
            successfulAttemptNos.add(a.attempt_no);
          } else {
            unnumberedCount++;
          }
        }
      }
    }

    if (
      isCurrentAttemptFinished &&
      (attemptPoints >= qualifyThreshold || attemptPoints > 2000)
    ) {
      if (typeof userData.attempt?.attempt_no === "number") {
        successfulAttemptNos.add(userData.attempt.attempt_no);
      } else if (successfulAttemptNos.size === 0 && unnumberedCount === 0) {
        unnumberedCount++;
      }
    }

    const successfulCount = successfulAttemptNos.size + unnumberedCount;

    // User is in the middle of playing attempt 2 if they won 1 game and already answered questions in attempt 2
    const isAttempt2InProgress =
      successfulCount === 1 && !isCurrentAttemptFinished && answeredCount > 0;

    // Redirect to GAME (final screen) ONLY IF:
    // 1) User has completed 2 successful games (without button)
    // 2) User has completed 1 successful game AND has not started playing the second game (with button)
    const shouldGoToFinishedScreen =
      successfulCount >= 2 ||
      (successfulCount === 1 && !isAttempt2InProgress);

    if (shouldGoToFinishedScreen) {
      return appRoutes.GAME;
    }

    if (userData.user?.subs) {
      return appRoutes.MENU;
    }

    return appRoutes.SUB;
  };
  // const tg = (window as any)?.Telegram?.WebApp;

  useEffect(() => {
    let navigated = false;
    let cancelled = false;

    const tg = (window as any)?.Telegram?.WebApp;
    tg?.ready?.();

    const go = (to: string) => {
      if (navigated || cancelled) return;

      navigated = true;
      navigate(to, { replace: true });
    };

    const effectiveUserId = getEffectiveUserId();

    const startParam =
      tg?.initDataUnsafe?.start_param ??
      new URLSearchParams(window.location.search).get("start_param") ??
      "";

    const initData = getTelegramInitData();
    // (window as any).__uid = effectiveUserId ?? null;

    console.log(initData)

    if (!effectiveUserId) {
      console.error("effectiveUserId not found");
      return;
    }
    if (!initData) {
      console.error("Telegram initData is empty");
      return;
    }

    try {
      const platform: string | undefined = tg?.platform;
      if (
        platform === "android" ||
        platform === "ios" ||
        platform === "android_x" ||
        platform === "unigram"
      ) {
        tg?.requestFullscreen?.();
        tg?.lockOrientation();
      } else if (
        platform === "tdesktop" ||
        platform === "weba" ||
        platform === "webk" ||
        platform === "unknown"
      ) {
        tg?.exitFullscreen?.();
        tg?.setMinimumHeight?.(700);
      }
      tg?.expand?.();
    } catch {
      tg?.expand?.();
    }
    try {
      tg?.disableVerticalSwipes?.();
    } catch {}

    initTelegramPlatformAndSafeArea();

    tg?.setHeaderColor?.("#f3f9ff");
    tg?.setBackgroundColor?.("#f3f9ff");
    tg?.setBottomBarColor?.("#f3f9ff");

    const preloadImages = async () => {
      try {
        const results = await preloadImageSrcs(APP_PRELOAD_IMAGES);

        const failedImages = results
          .filter((result) => !result.ok)
          .map((result) => result.src);

        if (failedImages.length) {
          console.warn("[preload] failed images:", failedImages);
        }
      } catch (err) {
        console.warn("[preload] error during image preloading:", err);
      }
    };

    const init = async () => {
      const minDelay = delay(MIN_LOADING_DELAY);

      const userDataPromise = fetchAndHydrateUserData(
        effectiveUserId,
        startParam,
      );

      const [userDataResult, preloadResult] = await Promise.allSettled([
        userDataPromise,
        preloadImages(),
        minDelay,
      ]);

      if (preloadResult.status !== "fulfilled") {
        console.error("Error preloading images:", preloadResult.reason);
        return;
      }

      if (cancelled) return;

      if (userDataResult.status !== "fulfilled") {
        console.error("Error fetching user data:", userDataResult.reason);
        return;
      }

      const userData = userDataResult.value;

      if (!userData.user) {
        console.error("User data is empty");
        return;
      }

      go(pickNextRoute(userData));
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [navigate]);
  return (
    <div
      className={`loading ${isMobile ? "loading--mobile" : "loading--desktop"}`}
      data-platform={isMobile ? "mobile" : "desktop"}
    >
      <div className="loading__content">
        <div className="loading__content_top">
          <img src={logo} alt="" className="loading__content_logo"/>
        </div>

        <div className="loading__content_bot">
          <img src={svoyak} alt="" className="loading__content_bot_svoyak"/>
          <Loader />
        </div>
      </div>
    </div>
  );
}

export default Loading;
