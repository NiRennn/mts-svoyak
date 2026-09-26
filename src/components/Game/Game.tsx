import { useState, useEffect, useRef, useMemo } from "react";
import type { FormEvent } from "react";
import "./Game.scss";
import { AudioPlayer } from "../AudioPlayer/AudioPlayer";
import { useNavigate } from "react-router-dom";
import appRoutes from "../../routes/routes";
import {
  ROUND_QUESTIONS,
  getTopicsWithQuestions,
  checkAnswerCorrectness,
} from "../../data/questions";
import type { Question, TopicGroup } from "../../data/questions";
import { useAppStore } from "../../store/appStore";
import type { ThemeDto } from "../../store/appStore";
import { submitAnswer } from "../../api/answer";
import type { SubmitAnswerResponse } from "../../api/answer";
import { fetchAndHydrateUserData } from "../../api/userData";
import { formatNbsp } from "../../utils/typography";
import { isMobileTelegram } from "../../utils/telegramPlatform";
import { preloadImageSrcs } from "../../utils/preload";

// Images
import valid from "../../assets/images/valid-kov.png";
import invalid from "../../assets/images/invalid-kov.png";
import timeHost from "../../assets/images/time-kov.png";
import modHost from "../../assets/images/mod-kov.png";
import roundHost1 from "../../assets/icons/round1.svg";
import roundHost2 from "../../assets/icons/round2.svg"; 
import roundpass from "../../assets/icons/game-check.svg";
import roundnotpass from "../../assets/icons/game-cross.svg";

import playerIcon from "../../assets/icons/player.png";
import svoyak from "../../assets/images/logo-top.png";
import logo from "../../assets/icons/mts-logo.svg";
import pres from "../../assets/icons/present.svg";
import lead from "../../assets/icons/leaderboard.svg";

const CHANNEL_URL = "https://mts.ru/riil?utm_source=mrk_sp&utm_medium=banner&utm_campaign=msc_mts_riil_q3_26&utm_term=app_final_igra";



type GameScreen =
  | "board"
  | "question"
  | "modifier"
  | "round-finished"
  | "game-finished";

type ModalResult =
  | "correct"
  | "wrong"
  | "timeout"
  | "modifier-plus"
  | "modifier-minus"
  | null;

const TOTAL_QUESTIONS_PER_ROUND = 25;
const QUESTION_TIMER_SECONDS = 300;

const CORRECT_ANSWER_PHRASES = [
  "Поздравляю, ты явно умнее одного постоянного гостя шоу!",
  "В точку! А ты точно не жульничаешь?",
  "Кто-то точно не прогуливал школу, в отличии от меня…",
  "Приз все ближе и ближе к тебе…",
  "Да ты профи в этой теме!",
  "Ты шаришь за разную дичь в интернете",
  "Ты зашел сюда просто пофлексить, какой ты умный?",
];

const WRONG_ANSWER_PHRASES = [
  "Вот такая подстава, дружок…",
  "Но за старания – лайк!",
  "Баллы спишем, но респект и уважуху отдаем тебе!",
  "После этого ответа ты мне напомнил одного знакомого…",
  "Тебе бы еще немного подучить лор интернета",
  "Почти, но нет",
  "Вопрос сложный, я б сам не ответил",
];

const getRandomPhrase = (phrases: string[]): string => {
  const index = Math.floor(Math.random() * phrases.length);
  return phrases[index];
};

const normalizeMediaUrl = (url?: string): string => {
  if (!url) return "";
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    url.startsWith("http://")
  ) {
    return url.replace(/^http:\/\//i, "https://");
  }
  return url;
};

const getMediaType = (
  q?: Question | null,
): "text" | "image" | "video" | "audio" => {
  if (!q) return "text";
  if (q.media_type === "video") return "video";
  if (q.media_type === "audio") return "audio";
  if (q.media_type === "image") return "image";
  if (q.media_type === "text") return "text";
  if (q.media_url) {
    const url = q.media_url.toLowerCase();
    if (url.match(/\.(mp4|webm|mov)(\?.*)?$/)) return "video";
    if (url.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/)) return "audio";
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/)) return "image";
  }
  return "text";
};

function Game() {
  const isMobile = isMobileTelegram();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const attempt = useAppStore((state) => state.attempt);
  const attempts = useAppStore((state) => state.attempts);
  const storeThemes = useAppStore((state) => state.themes);
  const storeAnsweredIds = useAppStore((state) => state.answered_question_ids);
  const canPlay = useAppStore((state) => state.can_play);
  const qualifyThreshold = useAppStore((state) => state.qualify_threshold);
  const bestPoints = useAppStore((state) => state.best_points);
  const hasQualified = useAppStore((state) => state.has_qualified);
  const setCanPlay = useAppStore((state) => state.setCanPlay);
  const setHasQualified = useAppStore((state) => state.setHasQualified);

  const answeredCount =
    storeAnsweredIds?.length ?? attempt?.answered_count ?? 0;
  const isCurrentAttemptFinished =
    Boolean(attempt?.is_finished) || answeredCount >= 75;

  const threshold = qualifyThreshold || 2000;

  const hasFinishedQualifiedAttempt =
    hasQualified ||
    (Array.isArray(attempts) &&
      attempts.some(
        (a) =>
          Boolean(a.is_finished) &&
          ((a.total_points ?? 0) >= threshold ||
            (a.total_points ?? 0) > 2000 ||
            (bestPoints ?? 0) >= threshold),
      ));

  const isAttempt2InProgress =
    hasFinishedQualifiedAttempt && !isCurrentAttemptFinished && answeredCount > 0;

  const isQualifiedAndFinished =
    hasFinishedQualifiedAttempt && !isAttempt2InProgress;

  // Determine starting round based on themes and already answered question IDs
  const calculateInitialRound = (
    themes: ThemeDto[],
    answeredIds: number[],
  ): number => {
    if (!themes.length) return 1;
    for (let r = 1; r <= 3; r++) {
      const themesInRound = themes.filter((t) => t.round === r);
      if (!themesInRound.length) continue;
      const qIds = themesInRound.flatMap((t) =>
        (t.questions || []).map((q) => q.id),
      );
      const isRoundDone =
        qIds.length > 0 && qIds.every((id) => answeredIds.includes(id));
      if (!isRoundDone) return r;
    }
    return 3;
  };

  const initialRound = calculateInitialRound(storeThemes, storeAnsweredIds);

  // State
  const [round, setRound] = useState<number>(initialRound);
  const [totalScore, setTotalScore] = useState<number>(
    attempt?.total_points ?? 0,
  );
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<number[]>(
    storeAnsweredIds ?? [],
  );
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [isInputActive, setIsInputActive] = useState<boolean>(false);
  const [screen, setScreen] = useState<GameScreen>(() => {
    // If user has a qualified attempt and has NOT started playing attempt 2 (answeredCount === 0),
    // show the victory screen of game 1!
    if (hasFinishedQualifiedAttempt && !isAttempt2InProgress) {
      return "game-finished";
    }
    if (isCurrentAttemptFinished) {
      return "game-finished";
    }
    return "board";
  });
  const [modalResult, setModalResult] = useState<ModalResult>(null);
  const [modalFeedbackText, setModalFeedbackText] = useState<string>("");
  const [modifierPoints, setModifierPoints] = useState<number>(0);
  const [timer, setTimer] = useState<number>(QUESTION_TIMER_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRestarting, setIsRestarting] = useState<boolean>(false);
  const [lastSubmitResponse, setLastSubmitResponse] =
    useState<SubmitAnswerResponse | null>(null);

  // Count successful attempts (> 2000 / >= threshold and finished)
  const successfulAttemptNos = useMemo(() => {
    const set = new Set<number>();
    let unnumberedCount = 0;
    if (Array.isArray(attempts)) {
      for (const a of attempts) {
        if (
          Boolean(a.is_finished) &&
          ((a.total_points ?? 0) >= threshold || (a.total_points ?? 0) > 2000)
        ) {
          if (typeof a.attempt_no === "number") {
            set.add(a.attempt_no);
          } else {
            unnumberedCount++;
          }
        }
      }
    }
    const curScore = Math.max(
      totalScore,
      attempt?.total_points ?? 0,
      lastSubmitResponse?.attempt_points ?? 0,
    );
    const isCurFinished =
      isCurrentAttemptFinished ||
      Boolean(lastSubmitResponse?.attempt_finished) ||
      screen === "game-finished";

    if (
      isCurFinished &&
      (curScore >= threshold || curScore > 2000 || lastSubmitResponse?.qualified)
    ) {
      if (typeof attempt?.attempt_no === "number") {
        set.add(attempt.attempt_no);
      } else if (set.size === 0 && unnumberedCount === 0) {
        unnumberedCount++;
      }
    }
    return { size: set.size + unnumberedCount };
  }, [
    attempts,
    attempt,
    threshold,
    totalScore,
    lastSubmitResponse,
    isCurrentAttemptFinished,
    screen,
  ]);

  const successfulCount = successfulAttemptNos.size;
  const canRestartAfterWin = successfulCount < 2 && canPlay !== false;

  const handleShowAnswerResult = (isCorrect: boolean) => {
    if (isCorrect) {
      setModalFeedbackText(getRandomPhrase(CORRECT_ANSWER_PHRASES));
      setModalResult("correct");
    } else {
      setModalFeedbackText(getRandomPhrase(WRONG_ANSWER_PHRASES));
      setModalResult("wrong");
    }
  };

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);

  const handleCloseVideoModal = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
    }
    setIsVideoModalOpen(false);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
  };

  const activeMediaType = getMediaType(activeQuestion);
  const isVideoQuestion = activeMediaType === "video";
  const isAudioQuestion = activeMediaType === "audio";
  const isImageQuestion = activeMediaType === "image";
  const isMediaWithoutTimer = isVideoQuestion || isAudioQuestion;
  const hasMedia = isVideoQuestion || isImageQuestion || isAudioQuestion;

  // Preload and decode critical modal host images immediately on Game mount
  useEffect(() => {
    preloadImageSrcs([valid, invalid, timeHost, modHost]);
  }, []);

  // Telegram BackButton support for question selection board and media modals
  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    const backButton = tg?.BackButton;

    if (!backButton) return;

    const handleTelegramBack = () => {
      if (isVideoModalOpen) {
        handleCloseVideoModal();
        return;
      }
      if (isImageModalOpen) {
        handleCloseImageModal();
        return;
      }
      navigate(appRoutes.MENU, { replace: true });
    };

    if (isVideoModalOpen || isImageModalOpen) {
      backButton.show();
      backButton.onClick(handleTelegramBack);
    } else if (screen === "board") {
      backButton.show();
      backButton.onClick(handleTelegramBack);
    } else {
      backButton.offClick(handleTelegramBack);
      backButton.hide();
    }

    return () => {
      backButton.offClick(handleTelegramBack);
      backButton.hide();
    };
  }, [screen, isVideoModalOpen, isImageModalOpen, navigate]);

  // Group questions by topic for the current round from store
  const currentRoundThemes = storeThemes.filter((t) => t.round === round);

  const topicGroups: TopicGroup[] =
    currentRoundThemes.length > 0
      ? currentRoundThemes.map((theme) => ({
          topic: theme.title,
          questions: (theme.questions || [])
            .map((q) => ({
              id: q.id,
              topic: theme.title,
              value: q.cost ?? q.value ?? 100,
              question: q.question ?? q.text ?? "",
              correctAnswers: Array.isArray(q.correctAnswers)
                ? q.correctAnswers
                : q.answer
                  ? [String(q.answer)]
                  : [String(q.correct_answer || "")].filter(Boolean),
              is_modifier: Boolean(q.is_modifier),
              modifier_value: q.modifier_value ?? 0,
              timer_sec: q.timer_sec ?? 30,
              media_type: q.media_type,
              media_url: q.media_url,
            }))
            .sort((a, b) => a.value - b.value),
        }))
      : getTopicsWithQuestions(ROUND_QUESTIONS);

  // Synchronize state with store when store updates after hydration
  useEffect(() => {
    if (storeAnsweredIds && storeAnsweredIds.length > 0) {
      setAnsweredQuestionIds((prev) => {
        const next = Array.from(new Set([...prev, ...storeAnsweredIds]));
        return next.length !== prev.length ? next : prev;
      });
    }
  }, [storeAnsweredIds]);

  const isRoundInitializedRef = useRef(storeThemes.length > 0);

  useEffect(() => {
    if (!isRoundInitializedRef.current && storeThemes.length > 0) {
      isRoundInitializedRef.current = true;
      const calcRound = calculateInitialRound(storeThemes, storeAnsweredIds);
      setRound(calcRound);
    }
  }, [storeThemes, storeAnsweredIds]);

  useEffect(() => {
    if (
      attempt?.total_points !== undefined &&
      attempt.total_points > 0 &&
      totalScore === 0
    ) {
      setTotalScore(attempt.total_points);
    }
  }, [attempt?.total_points]);

  // Current round answered questions count
  const currentRoundQuestions = topicGroups.flatMap((g) => g.questions);
  const currentRoundAnsweredCount = currentRoundQuestions.filter((q) =>
    answeredQuestionIds.includes(q.id),
  ).length;

  // Cumulative progress calculation for the bottom bar:
  // Round 1: 0..25 / 25
  // Round 2: 25..50 / 50
  // Round 3: 50..75 / 75
  const totalQuestionsForRound = round * TOTAL_QUESTIONS_PER_ROUND;

  const questionsUpToRound = storeThemes
    .filter((t) => t.round <= round)
    .flatMap((t) => t.questions || []);

  const totalAnsweredQuestions =
    questionsUpToRound.length > 0
      ? Math.max(
          questionsUpToRound.filter((q) => answeredQuestionIds.includes(q.id)).length,
          (round - 1) * TOTAL_QUESTIONS_PER_ROUND + currentRoundAnsweredCount,
        )
      : (round - 1) * TOTAL_QUESTIONS_PER_ROUND + currentRoundAnsweredCount;

  // Focus input when answering mode is active, or blur when modal is shown
  useEffect(() => {
    if (modalResult) {
      inputRef.current?.blur();
      return;
    }
    if (screen === "question" && isInputActive && !modalResult) {
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [screen, isInputActive, modalResult]);

  // Timer effect on question and modifier screen
  useEffect(() => {
    if (
      (screen === "question" || screen === "modifier") &&
      !modalResult &&
      !isSubmitting
    ) {
      if (screen === "question" && isMediaWithoutTimer) {
        return;
      }

      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        }); 
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [screen, modalResult, isSubmitting, isMediaWithoutTimer]);

  // Handlers
  const handleSelectQuestion = (q: Question) => {
    if (answeredQuestionIds.includes(q.id)) return;
    setActiveQuestion(q);
    setIsInputActive(false);
    setUserAnswer("");
    handleCloseVideoModal();
    handleCloseImageModal();
    setTimer(q.timer_sec || QUESTION_TIMER_SECONDS);
    // setTimer(QUESTION_TIMER_SECONDS);
    setModalResult(null);
    setModalFeedbackText("");

    if (q.is_modifier) {
      setScreen("modifier");
    } else {
      setScreen("question");
    }
  };

  const handleTimeOut = async () => {
    if (!activeQuestion || isSubmitting || isMediaWithoutTimer) return;
    setIsSubmitting(true);
    const userId = user?.tg_id ?? user?.user_id;

    if (userId) {
      try {
        if (activeQuestion.is_modifier) {
          const res = await submitAnswer({
            user_id: Number(userId),
            question_id: activeQuestion.id,
            modifier_accepted: false,
          });
          setTotalScore(res.attempt_points);
          setLastSubmitResponse(res);
        } else {
          const res = await submitAnswer({
            user_id: Number(userId),
            question_id: activeQuestion.id,
            skipped: true,
          });
          setTotalScore(res.attempt_points);
          setLastSubmitResponse(res);
        }
      } catch (err) {
        console.error("Error on timeout submit:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }

    setAnsweredQuestionIds((prev) =>
      prev.includes(activeQuestion.id) ? prev : [...prev, activeQuestion.id],
    );
    setModalResult("timeout");
  };

  const handlePass = async () => {
    if (!activeQuestion || isSubmitting || Boolean(modalResult)) return;
    inputRef.current?.blur();
    handleCloseVideoModal();
    if (timerRef.current) clearInterval(timerRef.current);

    setIsSubmitting(true);
    const userId = user?.tg_id ?? user?.user_id;
    let submitRes: SubmitAnswerResponse | null = null;

    if (userId) {
      try {
        submitRes = await submitAnswer({
          user_id: Number(userId),
          question_id: activeQuestion.id,
          skipped: true,
        });
        setTotalScore(submitRes.attempt_points);
        setLastSubmitResponse(submitRes);
      } catch (err) {
        console.error("Error on pass submit:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }

    const updated = answeredQuestionIds.includes(activeQuestion.id)
      ? answeredQuestionIds
      : [...answeredQuestionIds, activeQuestion.id];
    setAnsweredQuestionIds(updated);
    useAppStore.getState().addAnsweredQuestionId(activeQuestion.id);
    setActiveQuestion(null);
    setIsInputActive(false);
    setUserAnswer("");

    const allDoneInRound =
      currentRoundQuestions.length > 0 &&
      currentRoundQuestions.every((q) => updated.includes(q.id));

    const isRoundDone = Boolean(submitRes?.round_finished) || allDoneInRound;
    const isAttemptDone = Boolean(submitRes?.attempt_finished) && round >= 3;

    if (isAttemptDone) {
      setScreen("game-finished");
    } else if (isRoundDone) {
      if (round >= 3) {
        setScreen("game-finished");
      } else {
        setScreen("round-finished");
      }
    } else {
      setScreen("board");
    }
  };

  const handleSubmitAnswer = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!activeQuestion || !userAnswer.trim() || isSubmitting || Boolean(modalResult)) return;

    inputRef.current?.blur();
    handleCloseVideoModal();
    if (timerRef.current) clearInterval(timerRef.current);

    setIsSubmitting(true);
    const userId = user?.tg_id ?? user?.user_id;
    const answerText = userAnswer.trim();

    const updated = answeredQuestionIds.includes(activeQuestion.id)
      ? answeredQuestionIds
      : [...answeredQuestionIds, activeQuestion.id];
    setAnsweredQuestionIds(updated);

    if (userId) {
      try {
        const res = await submitAnswer({
          user_id: Number(userId),
          question_id: activeQuestion.id,
          answer: answerText,
        });
        setTotalScore(res.attempt_points);
        setLastSubmitResponse(res);
        if (res.is_correct) {
          handleShowAnswerResult(true);
        } else {
          handleShowAnswerResult(false);
        }
      } catch (err) {
        console.error("Error submitting answer:", err);
        const isCorrect = checkAnswerCorrectness(
          answerText,
          activeQuestion.correctAnswers,
        );
        if (isCorrect) {
          setTotalScore((prev) => prev + activeQuestion.value);
          handleShowAnswerResult(true);
        } else {
          setTotalScore((prev) => prev - activeQuestion.value);
          handleShowAnswerResult(false);
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
      const isCorrect = checkAnswerCorrectness(
        answerText,
        activeQuestion.correctAnswers,
      );
      if (isCorrect) {
        setTotalScore((prev) => prev + activeQuestion.value);
        handleShowAnswerResult(true);
      } else {
        setTotalScore((prev) => prev - activeQuestion.value);
        handleShowAnswerResult(false);
      }
    }
  };

  const handleTakeModifier = async () => {
    if (!activeQuestion || isSubmitting) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsSubmitting(true);
    const userId = user?.tg_id ?? user?.user_id;

    const updated = answeredQuestionIds.includes(activeQuestion.id)
      ? answeredQuestionIds
      : [...answeredQuestionIds, activeQuestion.id];
    setAnsweredQuestionIds(updated);

    if (userId) {
      try {
        const res = await submitAnswer({
          user_id: Number(userId),
          question_id: activeQuestion.id,
          modifier_accepted: true,
        });
        setTotalScore(res.attempt_points);
        setLastSubmitResponse(res);
        setModifierPoints(res.points);

        if (res.points >= 0) {
          setModalResult("modifier-plus");
        } else {
          setModalResult("modifier-minus");
        }
      } catch (err) {
        console.error("Error accepting modifier:", err);
        const modVal = activeQuestion.modifier_value || 500;
        setModifierPoints(modVal);
        if (modVal >= 0) {
          setTotalScore((prev) => prev + modVal);
          setModalResult("modifier-plus");
        } else {
          setTotalScore((prev) => prev + modVal);
          setModalResult("modifier-minus");
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
      const modVal = activeQuestion.modifier_value || 500;
      setModifierPoints(modVal);
      if (modVal >= 0) {
        setTotalScore((prev) => prev + modVal);
        setModalResult("modifier-plus");
      } else {
        setTotalScore((prev) => prev + modVal);
        setModalResult("modifier-minus");
      }
    }
  };

  const handlePassModifier = async () => {
    if (!activeQuestion || isSubmitting) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsSubmitting(true);
    const userId = user?.tg_id ?? user?.user_id;
    let submitRes: SubmitAnswerResponse | null = null;

    const updated = answeredQuestionIds.includes(activeQuestion.id)
      ? answeredQuestionIds
      : [...answeredQuestionIds, activeQuestion.id];
    setAnsweredQuestionIds(updated);

    if (userId) {
      try {
        submitRes = await submitAnswer({
          user_id: Number(userId),
          question_id: activeQuestion.id,
          modifier_accepted: false,
        });
        setTotalScore(submitRes.attempt_points);
        setLastSubmitResponse(submitRes);
      } catch (err) {
        console.error("Error passing modifier:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }

    setActiveQuestion(null);
    setIsInputActive(false);
    setUserAnswer("");

    const allDoneInRound =
      currentRoundQuestions.length > 0 &&
      currentRoundQuestions.every((q) => updated.includes(q.id));

    const isRoundDone = Boolean(submitRes?.round_finished) || allDoneInRound;
    const isAttemptDone = Boolean(submitRes?.attempt_finished) && round >= 3;

    if (isAttemptDone) {
      setScreen("game-finished");
    } else if (isRoundDone) {
      if (round >= 3) {
        setScreen("game-finished");
      } else {
        setScreen("round-finished");
      }
    } else {
      setScreen("board");
    }
  };

  const handleModalContinue = () => {
    handleCloseVideoModal();
    setModalResult(null);
    setModalFeedbackText("");
    setActiveQuestion(null);
    setIsInputActive(false);
    setUserAnswer("");

    const allDoneInRound =
      currentRoundQuestions.length > 0 &&
      currentRoundQuestions.every((q) => answeredQuestionIds.includes(q.id));

    const isRoundDone =
      Boolean(lastSubmitResponse?.round_finished) || allDoneInRound;
    const isAttemptDone =
      Boolean(lastSubmitResponse?.attempt_finished) && round >= 3;

    if (isAttemptDone) {
      setScreen("game-finished");
    } else if (isRoundDone) {
      if (round >= 3) {
        setScreen("game-finished");
      } else {
        setScreen("round-finished");
      }
    } else {
      setScreen("board");
    }
  };

  const handleNextRound = () => {
    if (round < 3) {
      setRound((prev) => prev + 1);
      setActiveQuestion(null);
      setIsInputActive(false);
      setUserAnswer("");
      setModalResult(null);
      setModalFeedbackText("");
      setScreen("board");
    } else {
      setScreen("game-finished");
    }
  };

  const handleGoToLeaderboard = () => {
    navigate(appRoutes.LEADERBOARD);
  };
  const handleGoToInfo = () => {
    navigate(appRoutes.INFO);
  };

  const handleRestartGame = async () => {
    if (isRestarting) return;
    if (successfulCount >= 2 || canPlay === false) return;

    const userId = user?.tg_id ?? user?.user_id;
    if (userId) {
      setIsRestarting(true);
      try {
        const raw = await fetchAndHydrateUserData(userId);
        if (raw.can_play === false) {
          setScreen("game-finished");
          return;
        }
        setRound(1);
        setTotalScore(raw.attempt?.total_points ?? 0);
        setAnsweredQuestionIds(raw.answered_question_ids ?? []);
        setActiveQuestion(null);
        setIsInputActive(false);
        setUserAnswer("");
        setModalResult(null);
        setModalFeedbackText("");
        setLastSubmitResponse(null);
        setScreen("board");
        return;
      } catch (err) {
        console.error("Error restarting game:", err);
      } finally {
        setIsRestarting(false);
      }
    }

    setRound(1);
    setTotalScore(0);
    setAnsweredQuestionIds([]);
    setActiveQuestion(null);
    setIsInputActive(false);
    setUserAnswer("");
    setModalResult(null);
    setModalFeedbackText("");
    setLastSubmitResponse(null);
    setScreen("board");
  };

  const isQualified =
    (screen === "game-finished" || isQualifiedAndFinished) &&
    (totalScore >= threshold ||
      totalScore > 2000 ||
      (bestPoints ?? 0) >= threshold ||
      (attempt?.total_points ?? 0) >= threshold ||
      hasFinishedQualifiedAttempt ||
      Boolean(lastSubmitResponse?.qualified));

  const finishedScore =
    bestPoints !== null && bestPoints !== undefined && bestPoints > 0
      ? Math.max(bestPoints, totalScore)
      : totalScore;

  useEffect(() => {
    if (isQualified && screen === "game-finished") {
      setHasQualified(true);
      if (successfulCount >= 2) {
        setCanPlay(false);
      }
    }
  }, [isQualified, screen, successfulCount, setCanPlay, setHasQualified]);

  const handleOpenChannel = () => {
    const tg = (window as any)?.Telegram?.WebApp;
    if (tg?.openLink) {
      tg.openLink(CHANNEL_URL);
    } else {
      window.open(CHANNEL_URL, "_blank", "noopener,noreferrer");
    }
  };

  // Render bottom bar for score & count
  const renderBottomBar = () => {
    const progressText =
      screen === "game-finished"
        ? "75/75"
        : `${totalAnsweredQuestions}/${totalQuestionsForRound}`;
    const displayPoints = screen === "game-finished" ? finishedScore : totalScore;

    return (
      <div className="game__bottom_bar">
        <div className="game__bottom_user">
          <img src={playerIcon} alt="player" className="game__bottom_avatar" />
          <div className="game__bottom_points_wrap">
            <span className="game__bottom_points_label">Ваши очки</span>
            <span className="game__bottom_points_val">{displayPoints}</span>
          </div>
        </div>

        <div className="game__bottom_progress">
          <span className="game__bottom_progress_text">
            {progressText}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`game ${isMobile ? "game--mobile" : "game--desktop"} ${
        modalResult ? "game--modal-open" : ""
      }`}
      data-platform={isMobile ? "mobile" : "desktop"}
    >
      {/* Hidden container to keep GPU textures of host illustrations permanently loaded and hot */}
      <div
        style={{
          position: "fixed",
          top: -9999,
          left: -9999,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <img src={valid} alt="" loading="eager" decoding="sync" />
        <img src={invalid} alt="" loading="eager" decoding="sync" />
        <img src={timeHost} alt="" loading="eager" decoding="sync" />
        <img src={modHost} alt="" loading="eager" decoding="sync" />
      </div>

      <div className="game__content">
        {/* SCREEN 1: BOARD */}
        {screen === "board" && (
          <div className="game__board_wrap">
            <div className="game__board_wrap_logo-svoyak">
              <img src={logo} alt="" className="game__board_wrap_logo" />
              <img src={svoyak} alt="" className="game__board_wrap_svoyak" />
            </div>

            <div className="game__board_card">
              {/* Header inside card */}
              <div className="game__board_header">
                <h2 className="game__board_round_title">Раунд {round}</h2>
                <div className="game__board_round_subtitle">
                  <p>Выберите тему и&nbsp;стоимость</p>
                </div>
              </div>

              {/* Rows of topics and values */}
              <div className="game__board_rows">
                {topicGroups.map((group) => (
                  <div key={group.topic} className="game__board_row">
                    <div className="game__board_topic_name">{formatNbsp(group.topic)}</div>

                    <div className="game__board_values">
                      {group.questions.map((q) => {
                        const isAnswered = answeredQuestionIds.includes(q.id);
                        return (
                          <button
                            key={q.id}
                            className={`game__board_val_btn ${
                              isAnswered ? "game__board_val_btn--answered" : ""
                            }`}
                            onClick={() => handleSelectQuestion(q)}
                            disabled={isAnswered}
                          >
                            {!isAnswered && (
                              <span className="game__board_val_text">
                                {q.value}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {renderBottomBar()}
          </div>
        )}

        {/* SCREEN 2: QUESTION */}
        {screen === "question" && activeQuestion && (
          <div className="game__question_wrap">
            <div className="game__question_top">
              <div
                className={`game__question_top_badge ${
                  isMediaWithoutTimer ? "game__question_top_badge--no-timer" : ""
                }`}
              >
                <div className="game__question_top_badge_theme-cost">
                  <span className="game__question_top_badge_theme">
                    {formatNbsp(activeQuestion.topic)}
                  </span>
                  <div className="game__question_top_badge_cost">
                    {activeQuestion.value}
                  </div>
                </div>
                {!isMediaWithoutTimer && (
                  <div className="game__question_top_badge_timer">
                    <span className="game__question_timer_text">{timer}&nbsp;сек</span>
                  </div>
                )}
              </div>
              {!isMediaWithoutTimer && (
                <div className="game__question_timer_bar">
                  <div
                    className="game__question_timer_fill"
                    style={{
                      width: `${(timer / (activeQuestion.timer_sec || QUESTION_TIMER_SECONDS)) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Main Question Card */}
            <div
              className={`game__question_card ${
                isInputActive ? "game__question_card--answering" : ""
              } ${hasMedia ? "game__question_card--has-media" : ""}`}
            >
              <div></div>
              <div
                className={`game__question_text_wrapper ${
                  hasMedia ? "game__question_text_wrapper--has-media" : ""
                }`}
              >
                <p
                  className={`game__question_text ${
                    hasMedia ? "game__question_text--has-media" : ""
                  }`}
                >
                  {formatNbsp(activeQuestion.question)}
                </p>

                {isImageQuestion && activeQuestion.media_url && (
                  <div
                    className="game__question_media_wrap game__question_media_wrap--image"
                    onClick={() => setIsImageModalOpen(true)}
                  >
                    <img
                      src={normalizeMediaUrl(activeQuestion.media_url)}
                      alt="Вопрос"
                      className="game__question_image"
                    />
                  </div>
                )}

                {isVideoQuestion && activeQuestion.media_url && (
                  <div className="game__question_media_wrap game__question_media_wrap--video">
                    <video
                      src={`${normalizeMediaUrl(activeQuestion.media_url)}#t=0.001`}
                      className="game__question_video_preview"
                      
                      playsInline
                      autoPlay
                      preload="metadata"
                    />
                    <div className="game__question_video_overlay">
                      <button
                        type="button"
                        className="game__question_video_btn"
                        onClick={() => setIsVideoModalOpen(true)}
                      >
                        СМОТРЕТЬ
                      </button>
                    </div>
                  </div>
                )}

                {isAudioQuestion && activeQuestion.media_url && (
                  <div className="game__question_media_wrap game__question_media_wrap--audio">
                    <AudioPlayer
                      src={normalizeMediaUrl(activeQuestion.media_url)}
                      isPaused={Boolean(modalResult)}
                    />
                  </div>
                )}
              </div>

              {isInputActive ? (
                <form
                  className="game__question_form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isSubmitting || Boolean(modalResult)) return;
                    handleSubmitAnswer(e);
                  }}
                >
                  <div className="game__question_input_wrap">
                    <input
                      ref={inputRef}
                      type="text"
                      className="game__question_input"
                      placeholder="Введите ответ..."
                      value={userAnswer}
                      maxLength={50}
                      disabled={isSubmitting || Boolean(modalResult)}
                      onChange={(e) => {
                        if (e.target.value.length <= 50) {
                          setUserAnswer(e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (isSubmitting || Boolean(modalResult))) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="game__question_submit_btn"
                    disabled={!userAnswer.trim() || isSubmitting || Boolean(modalResult)}
                  >
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 73 73"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 36.5L31.5 53L59 20"
                        stroke="white"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </form>
              ) : (
                <div className="game__question_actions">
                  <button
                    type="button"
                    className="game__btn_red"
                    onClick={() => setIsInputActive(true)}
                  >
                    <span className="game__btn_red_text">Дать ответ</span>
                  </button>

                  <button
                    type="button"
                    className="game__btn_pass"
                    onClick={handlePass}
                    disabled={isSubmitting || Boolean(modalResult)}
                  >
                    <span className="game__btn_pass_title">Пасануть</span>
                    <span className="game__btn_pass_sub">Баллы не&nbsp;спишем</span>
                  </button>
                </div>
              )}
            </div>

            {renderBottomBar()}
          </div>
        )}

        {/* SCREEN 2B: MODIFIER (537:4429) */}
        {screen === "modifier" && activeQuestion && (
          <div className="game__modifier_wrap">
            <div className="game__question_top">
              <div className="game__question_top_badge">
                <div className="game__question_top_badge_theme-cost">
                  <span className="game__question_top_badge_theme">
                    {formatNbsp(activeQuestion.topic)}
                  </span>
                  <div className="game__question_top_badge_cost">
                    {activeQuestion.value}
                  </div>
                </div>
                <div className="game__question_top_badge_timer">
                  <span className="game__question_timer_text">{timer}&nbsp;сек</span>
                </div>
              </div>
              <div className="game__question_timer_bar">
                <div
                  className="game__question_timer_fill"
                  style={{
                    width: `${(timer / (activeQuestion.timer_sec || QUESTION_TIMER_SECONDS)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="game__modifier_body"> 
              <div className="game__modifier_host_wrap">
                <img
                  src={modHost}
                  alt="Ведущий"
                  className="game__modifier_host_img"
                />
              </div>

              <div className="game__modifier_card">
                <p className="game__modifier_card_text">Попался модификатор</p>
                <p className="game__modifier_card_text">рискуем или ну&nbsp;его?</p>
              </div>

              <div className="game__modifier_actions">
                <button
                  type="button"
                  className="game__modifier_btn_take"
                  onClick={handleTakeModifier}
                  disabled={isSubmitting}
                >
                  <span className="game__modifier_btn_take_text">Забрать</span>
                </button>

                <button
                  type="button"
                  className="game__modifier_btn_pass"
                  onClick={handlePassModifier}
                  disabled={isSubmitting}
                >
                  <span className="game__modifier_btn_pass_title">
                    Пасануть
                  </span>
                  <span className="game__modifier_btn_pass_sub">
                    Баллы не&nbsp;спишем
                  </span>
                </button>
              </div>
            </div>

            {renderBottomBar()}
          </div>
        )}

        {/* SCREEN 3: ROUND FINISHED */}
        {screen === "round-finished" && (
          <div className="game__finished_wrap">
            <div className="game__finished_logo">
              <img src={logo} alt="МТС" />
            </div>

            <div className="game__finished_card">
              <div></div>
              <div className="game__finished_card_wrapper">
                <img
                  src={round === 1 ? roundHost1 : roundHost2}
                  alt="Round host"
                  className="game__finished_host_img"
                />

                <h1 className="game__finished_title">
                  Раунд <br />
                  завершен
                </h1>
              </div>

              {/* <div className="game__finished_btns"> */}
                <button className="game__btn_red_norm" onClick={handleNextRound}>
                  <span className="game__btn_red_norm_text">Продолжаем!</span>
                </button>
              {/* </div> */}
            </div>

            {renderBottomBar()}
          </div>
        )}

        {/* SCREEN 4: GAME FINISHED */}
        {screen === "game-finished" && (
          <div
            className={`game__finished_wrap ${
              isQualified ? "game__finished_wrap--qualified" : ""
            }`}
          >
            <div className="game__finished_logo">
              <img src={logo} alt="МТС" />
            </div>

            <div className="game__finished_card">
              <div></div>

              <div className="game__finished_card_wrapper">
                <div className="check-cross">
                  <img
                    src={isQualified ? roundpass : roundnotpass}
                    alt={isQualified ? "Победа" : "Проигрыш"}
                    className="game__finished_host_img_check-cross"
                  />
                </div>

                <h1 className="game__finished_title">
                  {isQualified ? (
                    <>
                      ИГРА <br />
                      ЗАВЕРШЕНА!
                    </>
                  ) : (
                    <>
                      Вопросы <br />
                      закончились
                    </>
                  )}
                </h1>
                <p className="game__finished_subtitle">
                  {isQualified
                    ? `Вы\u00A0прошли все темы и\u00A0набрали  ${finishedScore}\u00A0очков\nтеперь вы\u00A0участвуете в\u00A0розыгрыше призов\nот\u00A0МТС\u00A0РИИЛ`
                    : "Вы\u00A0прошли все темы, но\u00A0не\u00A0набрали 2000\u00A0очков для\u00A0участия в\u00A0розыгрыше, вы\u00A0можете повторить попытку еще\u00A0раз"}
                </p>
              </div>

              {isQualified ? (
                <div className="game__finished_qualified_actions">
                  <div className="game__finished_btn_row">
                    <button
                      type="button"
                      className="game__finished_btn_white"
                      onClick={handleGoToInfo}
                    >
                      <img
                        src={pres}
                        alt="О конкурсе"
                        className="game__finished_btn_white_img"
                      />
                      <span className="game__finished_btn_white_text">
                        О&nbsp;конкурсе
                      </span>
                    </button>

                    <button
                      type="button"
                      className="game__finished_btn_white"
                      onClick={handleGoToLeaderboard}
                    >
                      <img
                        src={lead}
                        alt="Лидерборд"
                        className="game__finished_btn_white_img"
                      />
                      <span className="game__finished_btn_white_text">
                        Лидерборд
                      </span>
                    </button>
                  </div>

                  {canRestartAfterWin && (
                    <button
                      type="button"
                      className="game__finished_btn_red_try"
                      onClick={handleRestartGame}
                      disabled={isSubmitting || isRestarting}
                    >
                      Начать с начала
                    </button>
                  )}
                  <button
                    type="button"
                    className="game__finished_btn_trans"
                    onClick={handleOpenChannel}
                  >
                    Подключить
                    <br />
                    тариф риил
                  </button>
                </div>
              ) : (
                <div className="game__finished_btns">
                  <button
                    className="game__finished_btn_red"
                    onClick={handleRestartGame}
                    disabled={isSubmitting || isRestarting}
                  >
                    <span className="game__finished_btn_red_text">
                      Повторить
                    </span>
                  </button>
                  <button
                    className="game__finished_btn_gray"
                    onClick={handleGoToInfo}
                  >
                    <span className="game__finished_btn_gray_text">
                      О&nbsp;розыгрыше
                    </span>
                  </button>
                </div>
              )}
            </div>

            {renderBottomBar()}
          </div>
        )}

        {/* Fullscreen Video Player Modal */}
        {isVideoModalOpen && activeQuestion && activeQuestion.media_url && (
          <div
            className="game__video_modal_overlay"
            onClick={handleCloseVideoModal}
          >
            <div
              className="game__video_modal_content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="game__video_modal_player_wrap">
                <video
                  ref={modalVideoRef}
                  src={normalizeMediaUrl(activeQuestion.media_url)}
                  className="game__video_modal_player"
                  controls
                  autoPlay
                  playsInline
                />
              </div>

              <button
                type="button"
                className="game__video_modal_close_btn"
                onClick={handleCloseVideoModal}
              >
                ЗАКРЫТЬ
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen Image Modal */}
        {isImageModalOpen && activeQuestion && activeQuestion.media_url && (
          <div
            className="game__video_modal_overlay"
            onClick={handleCloseImageModal}
          >
            <div
              className="game__video_modal_content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="game__image_modal_wrap">
                <img
                  src={normalizeMediaUrl(activeQuestion.media_url)}
                  alt="Вопрос"
                  className="game__image_modal_img"
                />
              </div>

              <button
                type="button"
                className="game__video_modal_close_btn"
                onClick={handleCloseImageModal}
              >
                ЗАКРЫТЬ
              </button>
            </div>
          </div>
        )}

        {/* MODAL RESULTS */}
        {modalResult && (
          <div className="game__modal_overlay">
            {/* Correct */}
            {modalResult === "correct" && (
              <>
                <div className="game__modal_host_wrap">
                  <div className="game__modal_badge_wrap">
                    <h2 className="game__modal_title">Верно!</h2>
                    <p className="game__modal_desc">
                      {formatNbsp(modalFeedbackText || CORRECT_ANSWER_PHRASES[0])}
                    </p>
                    <div className="game__modal_pill_badge game__modal_pill_badge--plus">
                      <span className="game__modal_pill_badge_text">
                        +
                        {Math.abs(
                          lastSubmitResponse?.points ||
                            activeQuestion?.value ||
                            100,
                        )}
                      </span>
                    </div>
                  </div>
                  <img
                    src={valid}
                    alt="Correct"
                    className="game__modal_host_img"
                    loading="eager"
                    decoding="sync"
                  />
                </div>
                <div className="game__modal_btn_wrap">
                  <button
                    type="button"
                    className="game__modal_btn"
                    onClick={handleModalContinue}
                  >
                    <span className="game__modal_btn_text">Продолжаем!</span>
                  </button>
                </div>
              </>
            )}

            {/* Wrong */}
            {modalResult === "wrong" && (
              <>
                <div className="game__modal_host_wrap">
                  <div className="game__modal_badge_wrap">
                    <h2 className="game__modal_title">Неверно!</h2>
                    <p className="game__modal_desc">
                      {formatNbsp(modalFeedbackText || WRONG_ANSWER_PHRASES[0])}
                    </p>
                    <div className="game__modal_pill_badge game__modal_pill_badge--minus">
                      <span className="game__modal_pill_badge_text">
                        -
                        {Math.abs(
                          lastSubmitResponse?.points ||
                            activeQuestion?.value ||
                            100,
                        )}
                      </span>
                    </div>
                  </div>
                  <img
                    src={invalid}
                    alt="Wrong"
                    className="game__modal_host_img"
                    loading="eager"
                    decoding="sync"
                  />
                </div>

                <div className="game__modal_btn_wrap">
                  <button
                    type="button"
                    className="game__modal_btn"
                    onClick={handleModalContinue}
                  >
                    <span className="game__modal_btn_text">Продолжаем!</span>
                  </button>
                </div>
              </>
            )}

            {/* Timeout */}
            {modalResult === "timeout" && (
              <>
                <div className="game__modal_host_wrap">
                  <div className="game__modal_badge_wrap game__modal_badge_wrap--timeout">
                    <h2 className="game__modal_title">Время кончилось</h2>
                    <p className="game__modal_desc">
                      Но&nbsp;похоже тебе нравится куртка ведущего, так что очки не&nbsp;списываем
                    </p>
                  </div>
                  <img
                    src={timeHost}
                    alt="Timeout"
                    className="game__modal_host_img"
                    loading="eager"
                    decoding="sync"
                  />
                </div>
                <div className="game__modal_btn_wrap">
                  <button
                    type="button"
                    className="game__modal_btn"
                    onClick={handleModalContinue}
                  >
                    <span className="game__modal_btn_text">Продолжаем!</span>
                  </button>
                </div>
              </>
            )}

            {/* Modifier Plus Result (537:4202) */}
            {modalResult === "modifier-plus" && (
              <div className="game__modal_modifier_wrap">
                <div className="wrapper"></div>

                <div className="game__modal_modifier_center">
                  <div className="game__modal_modifier_circle">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path
                        d="M24 10V38M10 24H38"
                        stroke="white"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h2 className="game__modal_modifier_title">
                    + {Math.abs(modifierPoints)} балов
                  </h2>
                  <div className="game__modal_modifier_desc">
                    <p className="game__modal_modifier_desc_p">
                      На&nbsp;счет прилетело {Math.abs(modifierPoints)}&nbsp;бонусных
                      баллов
                    </p>
                    <p className="game__modal_modifier_desc_p">круто&nbsp;же?</p>
                  </div>
                </div>

                <div className="game__modal_modifier_btn_wrap">
                  <button
                    type="button"
                    className="game__modal_modifier_btn"
                    onClick={handleModalContinue}
                  >
                    <span className="game__modal_modifier_btn_text">
                      Круто! Забрать
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Modifier Minus Result (537:4328) */}
            {modalResult === "modifier-minus" && (
              <div className="game__modal_modifier_wrap">
                <div className="wrapper"></div>

                <div className="game__modal_modifier_center">
                  <div className="game__modal_modifier_circle">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <path
                        d="M10 24H38"
                        stroke="white"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h2 className="game__modal_modifier_title">
                    - {Math.abs(modifierPoints)} балов
                  </h2>
                  <div className="game__modal_modifier_desc">
                    <p className="game__modal_modifier_desc_p">
                      К&nbsp;успеху шли, но&nbsp;не&nbsp;дошли!
                    </p>
                    <p className="game__modal_modifier_desc_p">
                      повезет в&nbsp;другой раз, на&nbsp;этот раз минус
                    </p>
                  </div>
                </div>
                <div className="game__modal_modifier_btn_wrap">
                  <button
                    type="button"
                    className="game__modal_modifier_btn"
                    onClick={handleModalContinue}
                  >
                    <span className="game__modal_modifier_btn_text">
                      Принять участь
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Game;
