import { useAppStore } from "../store/appStore";
import { getTelegramAuthHeaders } from "./telegramAuth";
const API_ORIGIN = "https://brother-in-law.brandservicebot.ru";

export type CheckSubscriptionResponse = {
  success?: boolean;
  subs: boolean;
  [key: string]: any;
};

export const checkUserSubscription = async (
  userId: number | string,
): Promise<CheckSubscriptionResponse> => {
  const response = await fetch(`${API_ORIGIN}/api/check_subscription/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
       ...getTelegramAuthHeaders(),
    },
    body: JSON.stringify({
      user_id: Number(userId),
    }),
  });

  if (!response.ok) {
    throw new Error(`POST /api/check_subscription/ → HTTP ${response.status}`);
  }

  const data: CheckSubscriptionResponse = await response.json();

  useAppStore.getState().setUserSubs(data.subs);

  return data;
};