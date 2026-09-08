const isDev = import.meta.env.DEV;

const DEV_TG_INIT_DATA = isDev
  ? String(import.meta.env.VITE_DEV_TG_INIT_DATA ?? "")
  : "";

const DEV_TG_USER_ID = isDev
  ? Number(import.meta.env.VITE_DEV_TG_USER_ID)
  : NaN;

export const getTelegramWebApp = () => {
  return (window as any)?.Telegram?.WebApp;
};

export const getTelegramInitData = (): string => {
  const tg = getTelegramWebApp();

  const realInitData = tg?.initData ?? "";

  if (realInitData) {
    return realInitData;
  }

  return DEV_TG_INIT_DATA;
};

export const getTelegramAuthHeaders = () => {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new Error("Telegram initData is empty");
  }

  return {
    Authorization: initData,
  };
};

export const getEffectiveUserId = (): number | null => {
  try {
    const tg = getTelegramWebApp();

    const idFromTelegram =
      tg?.initDataUnsafe?.user?.id != null
        ? Number(tg.initDataUnsafe.user.id)
        : NaN;

    if (Number.isFinite(idFromTelegram)) {
      return idFromTelegram;
    }

    const idFromQueryRaw = new URLSearchParams(window.location.search).get(
      "user_id",
    );

    const idFromQuery = idFromQueryRaw ? Number(idFromQueryRaw) : NaN;

    if (Number.isFinite(idFromQuery)) {
      return idFromQuery;
    }

    if (Number.isFinite(DEV_TG_USER_ID)) {
      return DEV_TG_USER_ID;
    }

    return null;
  } catch {
    return null;
  }
};