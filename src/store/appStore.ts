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
  question?: string;
  text?: string;
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
  rounds_done: number;
  next_round: number;
  total_points: number;
  is_finished: boolean;
};

export type WinnerDto = {
  user_id?: number;
  tg_id?: number;
  username: string | null;
  first_name: string | null;
};

export type GetUserDataResponse = {
  user: UserDto | null;
  attempt?: AttemptDto | null;
  last_round?: any;
  qualify_threshold?: number;
  rounds?: any[];
  themes?: ThemeDto[];
  winners?: WinnerDto[];
};

type AppState = {
  user: UserDto | null;
  attempt: AttemptDto | null;
  last_round: any;
  qualify_threshold: number;
  rounds: any[];
  themes: ThemeDto[];
  winners: WinnerDto[];
  isHydrated: boolean;

  setUser: (user: UserDto | null) => void;
  setUserSubs: (subs: boolean) => void;
  setUserRulesAccepted: (rulesAccepted: boolean) => void;
  setUserRule: (rule: boolean) => void;

  setAttempt: (attempt: AttemptDto | null) => void;
  setThemes: (themes: ThemeDto[]) => void;
  setWinners: (winners: WinnerDto[]) => void;

  hydrateFromServer: (data: GetUserDataResponse) => void;

  reset: () => void;
};

const initialState = {
  user: null,
  attempt: null,
  last_round: null,
  qualify_threshold: 3500,
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

    set({
      user,
      attempt: data.attempt ?? null,
      last_round: data.last_round ?? null,
      qualify_threshold: data.qualify_threshold ?? 3500,
      rounds: Array.isArray(data.rounds) ? data.rounds : [],
      themes: Array.isArray(data.themes) ? data.themes : [],
      winners: Array.isArray(data.winners) ? data.winners : [],
      isHydrated: true,
    });
  },

  reset: () => set(initialState),
}));
