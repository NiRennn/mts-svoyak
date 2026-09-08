import { useAppStore } from "../store/appStore";
import { getTelegramAuthHeaders } from "./telegramAuth";

const API_ORIGIN = "https://brother-in-law.brandservicebot.ru";

export type AcceptRulesResponse = {
  success: boolean;
  [key: string]: any;
};

export const acceptRules = async (
  userId: number | string
): Promise<AcceptRulesResponse> => {
  const response = await fetch(`${API_ORIGIN}/api/accept_rules/`, {
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
    throw new Error(`POST /api/accept_rules/ → HTTP ${response.status}`);
  }

  const data: AcceptRulesResponse = await response.json();

  if (data.success) {
    useAppStore.getState().setUserRulesAccepted(true);
  }

  return data;
};
