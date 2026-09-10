import { useAppStore } from "../store/appStore";
import { getTelegramAuthHeaders } from "./telegramAuth";

const API_ORIGIN = "https://brother-in-law.brandservicebot.ru";

export type SubmitAnswerRequest = {
  user_id: number;
  question_id: number;
  answer?: string;
  skipped?: boolean;
  modifier_accepted?: boolean;
};

export type SubmitAnswerResponse = {
  success: boolean;
  is_modifier: boolean;
  skipped?: boolean;
  is_correct?: boolean | null;
  correct_answer?: string;
  modifier_accepted?: boolean;
  modifier_value?: number;
  points: number;
  attempt_points: number;
  answered_count: number;
  round: number;
  round_finished: boolean;
  attempt_finished: boolean;
  qualified: boolean;
  qualify_threshold: number;
  best_points?: number;
  error?: string;
};

export const submitAnswer = async (
  params: SubmitAnswerRequest
): Promise<SubmitAnswerResponse> => {
  const response = await fetch(`${API_ORIGIN}/api/submit_answer/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTelegramAuthHeaders(),
    },
    body: JSON.stringify(params),
  });

  const data: SubmitAnswerResponse = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || `POST /api/submit_answer/ → HTTP ${response.status}`
    );
  }

  // Update store state with newly answered question & attempt stats
  const state = useAppStore.getState();
  state.addAnsweredQuestionId(params.question_id);

  if (data.best_points !== undefined) {
    state.setBestPoints(data.best_points);
  }

  if (state.attempt) {
    state.setAttempt({
      ...state.attempt,
      total_points: data.attempt_points,
      answered_count: data.answered_count,
      is_finished: data.attempt_finished,
    });
  }

  const isFinished = Boolean(data.attempt_finished);
  if (
    isFinished &&
    (data.qualified ||
      ((data.best_points ?? 0) >= (data.qualify_threshold || 3000)) ||
      data.attempt_points >= (data.qualify_threshold || 3000))
  ) {
    state.setCanPlay(false);
    state.setHasQualified(true);
  }

  return data;
};
