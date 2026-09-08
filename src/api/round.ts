import { useAppStore } from "../store/appStore";
import { getTelegramAuthHeaders } from "./telegramAuth";

const API_ORIGIN = "https://brother-in-law.brandservicebot.ru";

export type SubmitRoundRequest = {
  user_id: number;
  round: number;
  points: number;
};

export type SubmitRoundResponse = {
  success: boolean;
  round: number;
  round_points: number;
  attempt_points: number;
  finished: boolean;
  qualified: boolean;
  qualify_threshold: number;
  error?: string;
  expected_round?: number;
};

export const submitRound = async (
  userId: number | string,
  round: number,
  points: number
): Promise<SubmitRoundResponse> => {
  const response = await fetch(`${API_ORIGIN}/api/submit_round/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTelegramAuthHeaders(),
    },
    body: JSON.stringify({
      user_id: Number(userId),
      round: Number(round),
      points: Number(points),
    }),
  });

  const data: SubmitRoundResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `POST /api/submit_round/ → HTTP ${response.status}`);
  }

  // Update store with new attempt progress
  const currentAttempt = useAppStore.getState().attempt;
  if (currentAttempt) {
    useAppStore.getState().setAttempt({
      ...currentAttempt,
      rounds_done: data.round,
      next_round: data.round + 1,
      total_points: data.attempt_points,
      is_finished: data.finished,
    });
  }

  return data;
};
