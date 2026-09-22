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
  media_type?: string;
  media_url?: string;
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
  qualify_threshold: 2000,
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

    const qualifyThreshold = data.qualify_threshold ?? 2000;
    const bestPoints = data.best_points ?? 0;
    const attemptPoints = data.attempt?.total_points ?? 0;
    const answeredCount =
      data.answered_question_ids?.length ??
      data.attempt?.answered_count ??
      0;
    const isCurrentAttemptFinished =
      Boolean(data.attempt?.is_finished) || answeredCount >= 75;
    const serverCanPlay = data.can_play ?? true;

    // Count how many attempts are finished and qualified (>= qualifyThreshold or > 2000)
    const successfulAttemptNos = new Set<number>();
    let unnumberedCount = 0;
    if (Array.isArray(data.attempts)) {
      for (const a of data.attempts) {
        if (
          Boolean(a.is_finished) &&
          ((a.total_points ?? 0) >= qualifyThreshold || (a.total_points ?? 0) > 2000)
        ) {
          if (typeof a.attempt_no === "number") {
            successfulAttemptNos.add(a.attempt_no);
          } else {
            unnumberedCount++;
          }
        }
      }
    }

    if (
      isCurrentAttemptFinished &&
      (attemptPoints >= qualifyThreshold || attemptPoints > 2000)
    ) {
      if (typeof data.attempt?.attempt_no === "number") {
        successfulAttemptNos.add(data.attempt.attempt_no);
      } else if (successfulAttemptNos.size === 0 && unnumberedCount === 0) {
        unnumberedCount++;
      }
    }

    const successfulAttemptsCount = successfulAttemptNos.size + unnumberedCount;
    const isFullyQualified = successfulAttemptsCount >= 2;
    const hasQualified =
      successfulAttemptsCount > 0 || bestPoints >= qualifyThreshold;

    set({
      user,
      can_play: isFullyQualified ? false : serverCanPlay,
      has_qualified: hasQualified,
      attempts_played: data.attempts_played ?? 0,
      max_attempts: data.max_attempts ?? 2,
      best_points: data.best_points ?? null,
      attempt: data.attempt ?? null,
      attempts: Array.isArray(data.attempts) ? data.attempts : [],
      answered_question_ids: Array.isArray(data.answered_question_ids)
        ? data.answered_question_ids
        : [],
      last_round: data.last_round ?? null,
      qualify_threshold: data.qualify_threshold ?? 2000,
      rounds: Array.isArray(data.rounds) ? data.rounds : [],
      themes: Array.isArray(data.themes) ? data.themes : [],
      winners: Array.isArray(data.winners) ? data.winners : [],
      isHydrated: true,
    });
  },

  reset: () => set(initialState),
}));
