import { getTelegramAuthHeaders } from "./telegramAuth";

const API_ORIGIN = "https://brother-in-law.brandservicebot.ru";

export type LeaderboardUser = {
  rank: number;
  user_id: number;
  username: string | null;
  score: number;
  qualified: boolean;
};

export type LeaderboardResponse = {
  threshold: number;
  me: LeaderboardUser | null;
  top: LeaderboardUser[];
};

export const fetchLeaderboard = async (
  userId: number | string,
  top: number = 100
): Promise<LeaderboardResponse> => {
  const url = new URL(`${API_ORIGIN}/api/leaderboard/`);
  url.searchParams.set("user_id", String(userId));
  url.searchParams.set("top", String(top));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      ...getTelegramAuthHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error(`GET ${url.toString()} → HTTP ${response.status}`);
  }

  const data: LeaderboardResponse = await response.json();
  return data;
};
