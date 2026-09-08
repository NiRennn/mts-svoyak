import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import "./Game.scss";
import { useNavigate } from "react-router-dom";
import appRoutes from "../../routes/routes";
import {
  ROUND_QUESTIONS,
  getTopicsWithQuestions,
  checkAnswerCorrectness,
} from "../../data/questions";
import type { Question, TopicGroup } from "../../data/questions";
import { useAppStore } from "../../store/appStore";
import { submitRound } from "../../api/round";

// Images
import valid from "../../assets/images/valid-kov.png";
import invalid from "../../assets/images/invalid-kov.png";
import timeHost from "../../assets/images/time-kov.png";
import mod from "../../assets/images/mod-kov.png";
import roundHost1 from "../../assets/icons/round1.svg";
import roundHost2 from "../../assets/icons/round1.svg";
import roundpass from "../../assets/icons/game-check.svg";
import roundnotpass from "../../assets/icons/game-cross.svg";

import playerIcon from "../../assets/icons/player.png";
import svoyak from "../../assets/images/logo-top.png";
import plus from "../../assets/images/plus.png";
import minus from "../../assets/images/minus.png";
import logo from "../../assets/icons/mts-logo.svg";

type GameScreen = "board" | "question" | "round-finished" | "game-finished";
type ModalResult = "correct" | "wrong" | "timeout" | null;

const TOTAL_QUESTIONS_PER_ROUND = 25;
const QUESTION_TIMER_SECONDS = 30;

function Game() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const attempt = useAppStore((state) => state.attempt);
  const storeThemes = useAppStore((state) => state.themes);

  // Initialize round & score from attempt in store
  const initialRound =
    attempt?.next_round && attempt.next_round >= 1 && attempt.next_round <= 3
      ? attempt.next_round
      : 1;

  // State
  const [round, setRound] = useState<number>(initialRound);
  const [attemptBaseScore, setAttemptBaseScore] = useState<number>(
    attempt?.total_points ?? 0,
  );
  const [roundScore, setRoundScore] = useState<number>(0);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<number[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [isInputActive, setIsInputActive] = useState<boolean>(false);
  const [screen, setScreen] = useState<GameScreen>(
    attempt?.is_finished ? "game-finished" : "board",
  );
  const [modalResult, setModalResult] = useState<ModalResult>(null);
  const [, setLastAnswerDiff] = useState<number>(0);
  const [timer, setTimer] = useState<number>(QUESTION_TIMER_SECONDS);
  const [, setIsSubmittingRound] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const totalScore = attemptBaseScore + roundScore;

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
            }))
            .sort((a, b) => a.value - b.value),
        }))
      : getTopicsWithQuestions(ROUND_QUESTIONS);

  // Focus input when answering mode is active
  useEffect(() => {
    if (screen === "question" && isInputActive && !modalResult) {
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [screen, isInputActive, modalResult]);

  // Timer effect on question screen
  useEffect(() => {
    if (screen === "question" && !modalResult) {
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
  }, [screen, modalResult]);

  // Submit round to API when 25 questions are finished
  const handleFinishRound = async (finalRoundPoints: number) => {
    const userId = user?.tg_id ?? user?.user_id;
    if (userId) {
      setIsSubmittingRound(true);
      try {
        const res = await submitRound(userId, round, finalRoundPoints);
        setAttemptBaseScore(res.attempt_points);
        setRoundScore(0);
        if (res.finished || round >= 3) {
          setScreen("game-finished");
        } else {
          setScreen("round-finished");
        }
        return;
      } catch (err) {
        console.error("Error submitting round:", err);
      } finally {
        setIsSubmittingRound(false);
      }
    }

    // Fallback if no userId or offline
    setAttemptBaseScore((prev) => prev + finalRoundPoints);
    setRoundScore(0);
    if (round < 3) {
      setScreen("round-finished");
    } else {
      setScreen("game-finished");
    }
  };

  // Handlers
  const handleSelectQuestion = (q: Question) => {
    if (answeredQuestionIds.includes(q.id)) return;
    setActiveQuestion(q);
    setIsInputActive(false);
    setUserAnswer("");
    setTimer(QUESTION_TIMER_SECONDS);
    setModalResult(null);
    setScreen("question");
  };

  const handleTimeOut = () => {
    if (!activeQuestion) return;
    setAnsweredQuestionIds((prev) => [...prev, activeQuestion.id]);
    setLastAnswerDiff(0);
    setModalResult("timeout");
  };

  const handlePass = () => {
    if (!activeQuestion) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const updated = [...answeredQuestionIds, activeQuestion.id];
    setAnsweredQuestionIds(updated);
    setActiveQuestion(null);
    setIsInputActive(false);
    setUserAnswer("");

    if (updated.length >= TOTAL_QUESTIONS_PER_ROUND) {
      handleFinishRound(roundScore);
    } else {
      setScreen("board");
    }
  };

  const handleSubmitAnswer = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!activeQuestion || !userAnswer.trim()) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = checkAnswerCorrectness(
      userAnswer,
      activeQuestion.correctAnswers,
    );

    const updated = [...answeredQuestionIds, activeQuestion.id];
    setAnsweredQuestionIds(updated);

    if (isCorrect) {
      setRoundScore((prev) => prev + activeQuestion.value);
      setLastAnswerDiff(activeQuestion.value);
      setModalResult("correct");
    } else {
      setRoundScore((prev) => prev - activeQuestion.value);
      setLastAnswerDiff(-activeQuestion.value);
      setModalResult("wrong");
    }
  };

  const handleModalContinue = () => {
    setModalResult(null);
    setActiveQuestion(null);
    setIsInputActive(false);
    setUserAnswer("");

    if (answeredQuestionIds.length >= TOTAL_QUESTIONS_PER_ROUND) {
      handleFinishRound(roundScore);
    } else {
      setScreen("board");
    }
  };

  const handleNextRound = () => {
    if (round < 3) {
      setRound((prev) => prev + 1);
      setAnsweredQuestionIds([]);
      setRoundScore(0);
      setIsInputActive(false);
      setScreen("board");
    } else {
      setScreen("game-finished");
    }
  };

  const handleBackToMenu = () => {
    navigate(appRoutes.MENU);
  };
  const handleGoToLeaderboard = () => {
    navigate(appRoutes.LEADERBOARD);
  };
  const handleGoToInfo = () => {
    navigate(appRoutes.INFO);
  };

  const handleRestartGame = () => {
    setRound(1);
    setAttemptBaseScore(0);
    setRoundScore(0);
    setAnsweredQuestionIds([]);
    setActiveQuestion(null);
    setIsInputActive(false);
    setUserAnswer("");
    setScreen("board");

    const currentAttempt = useAppStore.getState().attempt;
    if (currentAttempt) {
      useAppStore.getState().setAttempt({
        ...currentAttempt,
        rounds_done: 0,
        next_round: 1,
        total_points: 0,
        is_finished: false,
      });
    }
  };

  const isQualified = totalScore >= 3000;

  // Render bottom bar for score & count
  const renderBottomBar = () => {
    return (
      <div className="game__bottom_bar">
        <div className="game__bottom_user">
          <img src={playerIcon} alt="player" className="game__bottom_avatar" />
          <div className="game__bottom_points_wrap">
            <span className="game__bottom_points_label">Ваши очки</span>
            <span className="game__bottom_points_val">{totalScore}</span>
          </div>
        </div>

        <div className="game__bottom_progress">
          <span className="game__bottom_progress_text">
            {answeredQuestionIds.length}/{TOTAL_QUESTIONS_PER_ROUND}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="game">
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
                  <p>Выберите тему и стоимость</p>
                </div>
              </div>

              {/* Rows of topics and values */}
              <div className="game__board_rows">
                {topicGroups.map((group) => (
                  <div key={group.topic} className="game__board_row">
                    <div className="game__board_topic_name">{group.topic}</div>

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
            {/* Top Badges: Topic & Timer */}
            {/* <div className="game__question_top">
              <div className="game__question_topic_badge">
                <span className="game__question_topic_badge_text">
                  {activeQuestion.topic}
                </span>
                <div className="game__question_topic_badge_val">
                  {activeQuestion.value}
                </div>
              </div>

              <div className="game__question_timer_badge">
                <span className="game__question_timer_text">{timer} сек</span>

              </div>
            </div> */}
            <div className="game__question_top">
              <div className="game__question_top_badge">
                <div className="game__question_top_badge_theme-cost">
                  <span className="game__question_top_badge_theme">
                    {activeQuestion.topic}
                  </span>
                  <div className="game__question_top_badge_cost">
                    {activeQuestion.value}
                  </div>
                </div>
                <div className="game__question_top_badge_timer">
                  <span className="game__question_timer_text">{timer} сек</span>
                </div>
              </div>
              <div className="game__question_timer_bar">
                <div
                  className="game__question_timer_fill"
                  style={{
                    width: `${(timer / QUESTION_TIMER_SECONDS) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Main Question Card */}
            <div
              className={`game__question_card ${
                isInputActive ? "game__question_card--answering" : ""
              }`}
            >
              <div></div>
              <div className="game__question_text_wrapper">
                <p className="game__question_text">{activeQuestion.question}</p>
              </div>

              {isInputActive ? (
                <form
                  className="game__question_form"
                  onSubmit={handleSubmitAnswer}
                >
                  <div className="game__question_input_wrap">
                    <input
                      ref={inputRef}
                      type="text"
                      className="game__question_input"
                      placeholder="Введите ответ..."
                      value={userAnswer}
                      maxLength={50}
                      onChange={(e) => {
                        if (e.target.value.length <= 50) {
                          setUserAnswer(e.target.value);
                        }
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="game__question_submit_btn"
                    disabled={!userAnswer.trim()}
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
                  >
                    <span className="game__btn_pass_title">Пасануть</span>
                    <span className="game__btn_pass_sub">Баллы не спишем</span>
                  </button>
                </div>
              )}
            </div>

            {renderBottomBar()}
          </div>
        )}

        {/* SCREEN 3: ROUND FINISHED */}
        {screen === "round-finished" && (
          <div className="game__finished_wrap">
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

              <div className="game__finished_btns">
                <button className="game__btn_red" onClick={handleNextRound}>
                  <span className="game__btn_red_text">Продолжить</span>
                </button>
              </div>
            </div>

            {renderBottomBar()}
          </div>
        )}

        {/* SCREEN 4: GAME FINISHED */}
        {screen === "game-finished" && (
          <div className="game__finished_wrap">
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
                      Игра <br />
                      завершена!
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
                    ? "Вы прошли все темы и набрали 3000 очков теперь вы участвуете в розыгрыше призов от МТС РИИЛ"
                    : "Вы прошли все темы но не набрали 3000 очков для участия в розыгрыше вы можете повторить попытку еще раз"}
                </p>
              </div>

              <div className="game__finished_btns">
                {isQualified ? (
                  <>
                    <button
                      className="game__finished_btn_gray"
                      onClick={handleGoToLeaderboard}
                    >
                      <span className="game__finished_btn_gray_text">
                        Лидеры
                      </span>
                    </button>
                    <button
                      className="game__finished_btn_gray"
                      onClick={handleGoToInfo}
                    >
                      <span className="game__finished_btn_gray_text">
                        О правилах
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="game__finished_btn_red"
                      onClick={handleRestartGame}
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
                        О розыгрыше
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {renderBottomBar()}
          </div>
        )}

        {/* MODAL RESULTS */}
        {modalResult && (
          <div className="game__modal_overlay">
            {/* <div></div> */}
            {/* Correct */}
            {modalResult === "correct" && (
              <>
                <img
                  src={valid}
                  alt="Correct"
                  className="game__modal_host_img"
                />
                <div className="game__modal_host_wrap">
                  <div className="game__modal_badge_wrap">
                    <h2 className="game__modal_title">Верно!</h2>
                    <p className="game__modal_desc">
                      Поздравляю, ты явно умнее одного постоянного гостя шоу!
                    </p>
                    <img
                      src={plus}
                      alt=""
                      className="game__modal_badge_wrap_img"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Wrong */}
            {modalResult === "wrong" && (
              <>
                <img
                  src={invalid}
                  alt="Wrong"
                  className="game__modal_host_img"
                />
                <div className="game__modal_host_wrap">
                  <div className="game__modal_badge_wrap">
                    <h2 className="game__modal_title">Не верно!</h2>
                    <p className="game__modal_desc">
                      Вот такая подстава, дружок…
                    </p>
                    <img
                      src={minus}
                      alt=""
                      className="game__modal_badge_wrap_img"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Timeout */}
            {modalResult === "timeout" && (
              <>
                <img
                  src={timeHost}
                  alt="Timeout"
                  className="game__modal_host_img"
                />
                <div className="game__modal_host_wrap">
                  <div className="game__modal_badge_wrap">
                    <h2 className="game__modal_title">Время кончилось</h2>
                    <p className="game__modal_desc">
                      Но похоже тебе нравится куртка ведущего, так что очки не
                      списываем
                    </p>
                  </div>
                </div>
              </>
            )}

            <button
              type="button"
              className="game__modal_btn"
              onClick={handleModalContinue}
            >
              <span className="game__modal_btn_text">Продолжить</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Game;
