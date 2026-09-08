type ImpactStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type NotificationType = "error" | "success" | "warning";

interface TelegramHapticFeedback {
  impactOccurred: (style: ImpactStyle) => void;
  notificationOccurred: (type: NotificationType) => void;
  selectionChanged: () => void;
}

const getHaptics = (): TelegramHapticFeedback | null => {
  const tg = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: TelegramHapticFeedback } } })?.Telegram?.WebApp;
  return tg?.HapticFeedback ?? null;
};

export const hapticImpact = (style: ImpactStyle = "medium") => {
  try {
    getHaptics()?.impactOccurred(style);
  } catch {
    // ignore outside Telegram WebApp
  }
};

export const hapticNotification = (type: NotificationType) => {
  try {
    getHaptics()?.notificationOccurred(type);
  } catch {
    // ignore outside Telegram WebApp
  }
};

export const hapticSelection = () => {
  try {
    getHaptics()?.selectionChanged();
  } catch {
    // ignore outside Telegram WebApp
  }
};
