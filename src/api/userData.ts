import { useAppStore } from "../store/appStore";
import type { GetUserDataResponse } from "../store/appStore";
import { getTelegramAuthHeaders } from "./telegramAuth";

const API_ORIGIN = "https://brother-in-law.brandservicebot.ru";

export const fetchAndHydrateUserData = async (
  userId: number | string,
  startParam: string = "",
): Promise<GetUserDataResponse> => {
  const url = new URL(`${API_ORIGIN}/api/get_user_data/`);

  url.searchParams.set("user_id", String(userId));

  if (startParam) {
    url.searchParams.set("start_param", startParam);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      ...getTelegramAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`GET ${url.toString()} → HTTP ${response.status}`);
  }

  const raw: GetUserDataResponse = await response.json();

  useAppStore.getState().hydrateFromServer(raw);

  return raw;
};