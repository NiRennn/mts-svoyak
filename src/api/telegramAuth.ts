const isLocal =
  Boolean(import.meta.env.DEV) ||
  (typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".localhost")));

const DEV_TG_INIT_DATA = String(import.meta.env.VITE_DEV_TG_INIT_DATA ?? "").trim();

const DEV_TG_USER_ID = Number(import.meta.env.VITE_DEV_TG_USER_ID);

export const getTelegramWebApp = () => {
  return (window as any)?.Telegram?.WebApp;
};

export const getTelegramInitData = (): string => {
  if (isLocal && DEV_TG_INIT_DATA) {
    return DEV_TG_INIT_DATA;
  }

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
    if (isLocal) {
      if (Number.isFinite(DEV_TG_USER_ID) && DEV_TG_USER_ID > 0) {
        return DEV_TG_USER_ID;
      }
      if (DEV_TG_INIT_DATA) {
        try {
          const params = new URLSearchParams(DEV_TG_INIT_DATA);
          const userStr = params.get("user");
          if (userStr) {
            const parsedUser = JSON.parse(userStr);
            if (parsedUser?.id) return Number(parsedUser.id);
          }
        } catch {}
      }
    }

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

    if (Number.isFinite(DEV_TG_USER_ID) && DEV_TG_USER_ID > 0) {
      return DEV_TG_USER_ID;
    }

    return null;
  } catch {
    return null;
  }
};