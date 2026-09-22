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
  can_play?: boolean;
  error?: string;
};

export const submitAnswer = async (
  params: SubmitAnswerRequest,
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
      data.error || `POST /api/submit_answer/ → HTTP ${response.status}`,
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

  const threshold = data.qualify_threshold || state.qualify_threshold || 2000;
  const isFinished = Boolean(data.attempt_finished);
  const isQualified =
    data.qualified ||
    data.attempt_points >= threshold ||
    data.attempt_points > 2000 ||
    (data.best_points ?? 0) >= threshold;

  if (isFinished && isQualified) {
    state.setHasQualified(true);

    const successfulPastAttempts = (state.attempts || []).filter(
      (a) =>
        Boolean(a.is_finished) &&
        ((a.total_points ?? 0) >= threshold || (a.total_points ?? 0) > 2000) &&
        a.attempt_no !== state.attempt?.attempt_no,
    );
    const totalSuccessful = successfulPastAttempts.length + 1;

    if (totalSuccessful >= 2 || data.can_play === false) {
      state.setCanPlay(false);
    } else if (data.can_play !== undefined) {
      state.setCanPlay(data.can_play);
    }
  } else if (data.can_play !== undefined) {
    state.setCanPlay(data.can_play);
  }

  return data;
};
