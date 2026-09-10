import { create } from "zustand";

export type UserDto = {
  tg_id: number;
  user_id?: number;
  username: string | null;
  first_name: string | null;
  last_name?: string | null;
  utm: string | null;
  subs: boolean;
  rules_accepted: boolean;
  rule?: boolean;
  created_at: string;
};

export type QuestionDto = {
  id: number;
  cost?: number;
  value?: number;
  is_modifier?: boolean;
  modifier_value?: number;
  question?: string;
  text?: string;
  correct_answer?: string;
  synonyms?: string[];
  timer_sec?: number;
  comment?: string;
  [key: string]: any;
};

export type ThemeDto = {
  id: number;
  round: number;
  theme_no: number;
  title: string;
  questions?: QuestionDto[];
};

export type AttemptDto = {
  attempt_no: number;
  answer_set: string;
  rounds_done?: number;
  next_round?: number;
  total_points: number;
  answered_count?: number;
  cells_total?: number;
  is_finished: boolean;
};

export type WinnerDto = {
  place: number;
  prize: string;
  tg_id: number;
  user_id?: number;
  username: string | null;
  first_name: string | null;
};

export type AttemptSummaryDto = {
  attempt_no: number;
  answer_set?: string;
  total_points: number;
  answered_count: number;
  is_finished: boolean;
  created_dt?: string | null;
  finished_dt?: string | null;
};

export type GetUserDataResponse = {
  user: UserDto | null;
  can_play?: boolean;
  attempts_played?: number;
  max_attempts?: number;
  best_points?: number | null;
  attempt?: AttemptDto | null;
  attempts?: AttemptSummaryDto[];
  answered_question_ids?: number[];
  qualify_threshold?: number;
  last_round?: any;
  rounds?: any[];
  themes?: ThemeDto[];
  winners?: WinnerDto[];
};

type AppState = {
  user: UserDto | null;
  can_play: boolean;
  attempts_played: number;
  max_attempts: number;
  best_points: number | null;
  attempt: AttemptDto | null;
  attempts: AttemptSummaryDto[];
  answered_question_ids: number[];
  last_round: any;
  qualify_threshold: number;
  rounds: any[];
  themes: ThemeDto[];
  winners: WinnerDto[];
  has_qualified: boolean;
  isHydrated: boolean;

  setUser: (user: UserDto | null) => void;
  setUserSubs: (subs: boolean) => void;
  setUserRulesAccepted: (rulesAccepted: boolean) => void;
  setUserRule: (rule: boolean) => void;

  setCanPlay: (canPlay: boolean) => void;
  setHasQualified: (hasQualified: boolean) => void;
  setBestPoints: (bestPoints: number | null) => void;
  setAnsweredQuestionIds: (ids: number[]) => void;
  addAnsweredQuestionId: (id: number) => void;

  setAttempt: (attempt: AttemptDto | null) => void;
  setThemes: (themes: ThemeDto[]) => void;
  setWinners: (winners: WinnerDto[]) => void;

  hydrateFromServer: (data: GetUserDataResponse) => void;

  reset: () => void;
};

const initialState = {
  user: null,
  can_play: true,
  has_qualified: false,
  attempts_played: 0,
  max_attempts: 2,
  best_points: null,
  attempt: null,
  attempts: [],
  answered_question_ids: [],
  last_round: null,
  qualify_threshold: 3000,
  rounds: [],
  themes: [],
  winners: [],
  isHydrated: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),

  setUserSubs: (subs) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            subs,
          }
        : null,
    })),

  setUserRulesAccepted: (rules_accepted) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            rules_accepted,
            rule: rules_accepted,
          }
        : null,
    })),

  setUserRule: (rule) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            rules_accepted: rule,
            rule,
          }
        : null,
    })),

  setCanPlay: (can_play) => set({ can_play }),

  setHasQualified: (has_qualified) => set({ has_qualified }),

  setBestPoints: (best_points) => set({ best_points }),

  setAnsweredQuestionIds: (answered_question_ids) =>
    set({ answered_question_ids }),

  addAnsweredQuestionId: (id) =>
    set((state) => ({
      answered_question_ids: state.answered_question_ids.includes(id)
        ? state.answered_question_ids
        : [...state.answered_question_ids, id],
    })),

  setAttempt: (attempt) => set({ attempt }),

  setThemes: (themes) => set({ themes }),

  setWinners: (winners) => set({ winners }),

  hydrateFromServer: (data) => {
    const user = data.user
      ? {
          ...data.user,
          user_id: data.user.tg_id ?? data.user.user_id,
          rules_accepted: data.user.rules_accepted ?? data.user.rule ?? false,
          rule: data.user.rules_accepted ?? data.user.rule ?? false,
        }
      : null;

    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem("user_game_qualified");
      } catch (e) {}
    }

    const qualifyThreshold = data.qualify_threshold ?? 3000;
    const bestPoints = data.best_points ?? 0;
    const attemptPoints = data.attempt?.total_points ?? 0;
    const answeredCount =
      data.answered_question_ids?.length ??
      data.attempt?.answered_count ??
      0;
    const isCurrentAttemptFinished =
      Boolean(data.attempt?.is_finished) || answeredCount >= 75;
    const serverCanPlay = data.can_play ?? true;

    // Check if the user has already completed a winning attempt in the attempts history
    const hasFinishedQualifiedAttemptInList =
      Array.isArray(data.attempts) &&
      data.attempts.some(
        (a) =>
          Boolean(a.is_finished) &&
          ((a.total_points ?? 0) >= qualifyThreshold || bestPoints >= qualifyThreshold),
      );

    const isCurrentAttemptQualified =
      isCurrentAttemptFinished &&
      (attemptPoints >= qualifyThreshold || bestPoints >= qualifyThreshold);

    const isExhaustedQualified =
      !serverCanPlay &&
      Math.max(bestPoints, attemptPoints) >= qualifyThreshold;

    const isQualifiedUser =
      hasFinishedQualifiedAttemptInList ||
      isCurrentAttemptQualified ||
      isExhaustedQualified;

    set({
      user,
      can_play: isQualifiedUser ? false : serverCanPlay,
      has_qualified: isQualifiedUser,
      attempts_played: data.attempts_played ?? 0,
      max_attempts: data.max_attempts ?? 2,
      best_points: data.best_points ?? null,
      attempt: data.attempt ?? null,
      attempts: Array.isArray(data.attempts) ? data.attempts : [],
      answered_question_ids: Array.isArray(data.answered_question_ids)
        ? data.answered_question_ids
        : [],
      last_round: data.last_round ?? null,
      qualify_threshold: data.qualify_threshold ?? 3000,
      rounds: Array.isArray(data.rounds) ? data.rounds : [],
      themes: Array.isArray(data.themes) ? data.themes : [],
      winners: Array.isArray(data.winners) ? data.winners : [],
      isHydrated: true,
    });
  },

  reset: () => set(initialState),
}));
