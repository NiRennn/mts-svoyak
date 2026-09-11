import "./Menu.scss";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import appRoutes from "../../routes/routes";
import svoyak from "../../assets/images/logo-top.png";
import closeIcon from "../../assets/icons/close.svg";
import { useAppStore } from "../../store/appStore";
import { acceptRules } from "../../api/rules";

import pres from "../../assets/icons/present.svg";
import lead from "../../assets/icons/leaderboard.svg";
// import kov from "../../assets/images/loader-kov1.png";
import kov from "../../assets/images/menu-kov.png";
import logo from "../../assets/icons/mts-logo.svg";
import { isMobileTelegram } from "../../utils/telegramPlatform";

// type MenuContentState = "game" | "all-found" | "finished";

const CHANNEL_URL = "https://t.me/eto_riil";

function Menu() {
  const isMobile = isMobileTelegram();
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const hasQualified = useAppStore((state) => state.has_qualified);
  const canPlay = useAppStore((state) => state.can_play);
  const attempt = useAppStore((state) => state.attempt);
  const attempts = useAppStore((state) => state.attempts);
  const bestPoints = useAppStore((state) => state.best_points);
  const qualifyThreshold = useAppStore((state) => state.qualify_threshold);
  const storeAnsweredIds = useAppStore((state) => state.answered_question_ids);

  const answeredCount =
    storeAnsweredIds?.length ?? attempt?.answered_count ?? 0;
  const isCurrentAttemptFinished =
    Boolean(attempt?.is_finished) || answeredCount >= 75;

  const hasFinishedQualifiedAttempt =
    Array.isArray(attempts) &&
    attempts.some(
      (a) =>
        Boolean(a.is_finished) &&
        ((a.total_points ?? 0) >= (qualifyThreshold || 3000) ||
          (bestPoints ?? 0) >= (qualifyThreshold || 3000)),
    );

  const isQualifiedAndFinished =
    hasQualified ||
    hasFinishedQualifiedAttempt ||
    (isCurrentAttemptFinished &&
      ((attempt?.total_points ?? 0) >= (qualifyThreshold || 3000) ||
        (bestPoints ?? 0) >= (qualifyThreshold || 3000))) ||
    (!canPlay &&
      Math.max(bestPoints ?? 0, attempt?.total_points ?? 0) >=
        (qualifyThreshold || 3000));

  useEffect(() => {
    if (isQualifiedAndFinished) {
      navigate(appRoutes.GAME, { replace: true });
    }
  }, [isQualifiedAndFinished, navigate]);

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    tg?.BackButton?.hide?.();
  }, []);

  const menuContentState = "game";
  // const [isLoading, setIsLoading] = useState(false);
  const [isLoading, ] = useState(false);

  // Rules Modal State
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleOpenChannel = () => {
    const tg = (window as any)?.Telegram?.WebApp;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(CHANNEL_URL);
      return;
    }

    window.open(CHANNEL_URL, "_blank", "noopener,noreferrer");
  };

  const handleStartGameClick = () => {
    const rulesAccepted = user?.rules_accepted ?? user?.rule ?? false;
    if (rulesAccepted) {
      navigate(appRoutes.GAME);
    } else {
      setIsRulesModalOpen(true);
    }
  };

  const handleAcceptAndStart = async () => {
    if (!isAgreed || isAccepting) return;

    const userId = user?.tg_id ?? user?.user_id;
    if (!userId) {
      navigate(appRoutes.GAME);
      return;
    }

    setIsAccepting(true);
    try {
      const res = await acceptRules(userId);
      if (res?.success) {
        setIsRulesModalOpen(false);
        navigate(appRoutes.GAME);
      }
    } catch (error) {
      console.error("Error accepting rules:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const renderGameContent = () => {
    return (
      <>
        <img src={logo} alt="" className="menu__logo" />
        <div className="menu__img_block">
          <img src={kov} alt="" className="menu__img_kov" />
          <img src={svoyak} alt="" className="menu__img_svoyak" />
        </div>

        <div className="menu__btn_block">
          <button
            className="menu__btn_block_red-button"
            onClick={handleStartGameClick}
          >
            Начать игру
          </button>
          <div className="menu__btn_block-horizontal">
            <button
              className="menu__btn_block_white-button"
              onClick={() => navigate(appRoutes.INFO)}
            >
              <img
                src={pres}
                alt=""
                className="menu__btn_block_white-button-img"
              />
              <span className="menu__btn_block_white-button-text">
                О&nbsp;конкурсе
              </span>
            </button>
            <button
              className="menu__btn_block_white-button"
              onClick={() => navigate(appRoutes.LEADERBOARD)}
            >
              <img
                src={lead}
                alt=""
                className="menu__btn_block_white-button-img"
              />
              <span className="menu__btn_block_white-button-text">
                Лидерборд
              </span>
            </button>
          </div>
          <button
            className="menu__btn_block_trans-button"
            onClick={handleOpenChannel}
          >
            Подключить <br />
            тариф риил
          </button>
        </div>
      </>
    );
  };

  return (
    <div
      className={`menu ${isMobile ? "menu--mobile" : "menu--desktop"}`}
      data-state={menuContentState}
      data-loading={isLoading}
      data-platform={isMobile ? "mobile" : "desktop"}
    >
      <div className="menu__content">
        <div className="menu__content_main">
          {menuContentState === "game" && renderGameContent()}
        </div>
      </div>

      {/* RULES BOTTOM SHEET MODAL */}
      {isRulesModalOpen && (
        <div
          className="menu_rules_overlay"
          onClick={() => setIsRulesModalOpen(false)}
        >
          <div
            className="menu_rules_modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="menu_rules_modal__close"
              onClick={() => setIsRulesModalOpen(false)}
            >
              <img src={closeIcon} alt="Закрыть" />
            </button>
            <h2 className="menu_rules_modal__title">Правила</h2>

            <p className="menu_rules_modal__desc">
              Отвечайте на&nbsp;вопросы и&nbsp;зарабатывайте очки, наберите больше 3000&nbsp;очков
              и&nbsp;участвуйте в&nbsp;розыгрыше
            </p>

            <div className="menu_rules_modal__checkbox_row">
              <button
                type="button"
                className={`menu_rules_modal__checkbox ${
                  isAgreed ? "menu_rules_modal__checkbox--checked" : ""
                }`}
                onClick={() => setIsAgreed(!isAgreed)}
              >
                <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                  <path
                    d="M1 5.5L5 9.5L13 1.5"
                    stroke={isAgreed ? "#ffffff" : "#00000026"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <span className="menu_rules_modal__checkbox_label">
                Я&nbsp;ознакомился и&nbsp;соглашаюсь с&nbsp;
                <a
                  href="https://ya.ru/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu_rules_modal__link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Правилами конкурса
                </a>
              </span>
            </div>

            <button
              className="menu_rules_modal__btn"
              disabled={!isAgreed || isAccepting}
              onClick={handleAcceptAndStart}
            >
              <span className="menu_rules_modal__btn_text">
                {isAccepting ? "Загрузка..." : "Начать"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;
