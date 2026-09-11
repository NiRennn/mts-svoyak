import "./Info.scss";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import appRoutes from "../../routes/routes";
import { useAppStore } from "../../store/appStore";
import { acceptRules } from "../../api/rules";
import { formatNbsp } from "../../utils/typography";

import prize from "../../assets/images/prize.png";
import closeIcon from "../../assets/icons/close.svg";
import infoLogo from "../../assets/images/logo-top.png";
import logo from "../../assets/icons/mts-logo.svg";
import chelik from "../../assets/images/info-man.png";
import { isMobileTelegram } from "../../utils/telegramPlatform";

type FaqItem = {
  id: number;
  title: string;
  text: string;
};

const faqItems: FaqItem[] = [
  {
    id: 1,
    title: "Как\u00A0принять участие в\u00A0розыгрыше?",
    text: "Lorem ipsum dolor sit amet consectetur. Gravida nec semper faucibus aliquam lacus sem vel non sapien. Sed viverra arcu ultrices id adipiscing quisque mollis condimentum in. Non lacinia enim suspendisse id pharetra eu nibh facilisi in. Lacus diam nisl at lectus enim. Diam id urna scelerisque et enim praesent egestas sit. Et arcu massa dignissim fringilla. Elementum pellentesque id.",
  },
  {
    id: 2,
    title: "Кто организатор розыгрыша",
    text: "Lorem ipsum dolor sit amet consectetur. Gravida nec semper faucibus aliquam lacus sem vel non sapien. Sed viverra arcu ultrices id adipiscing quisque mollis condimentum in. Non lacinia enim suspendisse id pharetra eu nibh facilisi in. Lacus diam nisl at lectus enim. Diam id urna scelerisque et enim praesent egestas sit. Et arcu massa dignissim fringilla. Elementum pellentesque id.",
  },
  {
    id: 3,
    title: "Что можно выиграть?",
    text: "Lorem ipsum dolor sit amet consectetur. Gravida nec semper faucibus aliquam lacus sem vel non sapien. Sed viverra arcu ultrices id adipiscing quisque mollis condimentum in. Non lacinia enim suspendisse id pharetra eu nibh facilisi in. Lacus diam nisl at lectus enim. Diam id urna scelerisque et enim praesent egestas sit. Et arcu massa dignissim fringilla. Elementum pellentesque id.",
  },
];

const prizes = [
  {
    id: 1,
    image: prize,
    name: "Фирменный кардхолдер МТС",
    count: "25 шт",
    className: "cardholder",
  },
  {
    id: 2,
    image: prize,
    name: "Фирменный кардхолдер МТС",
    count: "25 шт",
    className: "cardholder",
  },
  {
    id: 3,
    image: prize,
    name: "Фирменный кардхолдер МТС",
    count: "25 шт",
    className: "cardholder",
  },
];

const CHANNEL_URL = "https://t.me/eto_riil";

function Info() {
  const isMobile = isMobileTelegram();
  const user = useAppStore((state) => state.user);
  const navigate = useNavigate();

  const [openedFaqId, setOpenedFaqId] = useState<number>(1);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

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

  const isQualifiedUser =
    hasQualified ||
    hasFinishedQualifiedAttempt ||
    (isCurrentAttemptFinished &&
      ((attempt?.total_points ?? 0) >= (qualifyThreshold || 3000) ||
        (bestPoints ?? 0) >= (qualifyThreshold || 3000))) ||
    (!canPlay &&
      Math.max(bestPoints ?? 0, attempt?.total_points ?? 0) >=
        (qualifyThreshold || 3000));

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    const backButton = tg?.BackButton;

    if (!backButton) return;

    const handleTelegramBack = () => {
      navigate(isQualifiedUser ? appRoutes.GAME : appRoutes.MENU, {
        replace: true,
      });
    };

    backButton.show();
    backButton.onClick(handleTelegramBack);

    return () => {
      backButton.offClick(handleTelegramBack);
      backButton.hide();
    };
  }, [navigate, isQualifiedUser]);

  const handleToggleFaq = (id: number) => {
    setOpenedFaqId((prev) => (prev === id ? 0 : id));
  };

  const handleOpenRiil = () => {
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

  return (
    <div
      className={`info ${isMobile ? "info--mobile" : "info--desktop"}`}
      data-platform={isMobile ? "mobile" : "desktop"}
    >
      <div className="info__scroll">
        <div className="info__logo_wrapper">
          <img src={logo} alt="" className="info__logo_mts"/>
          <img src={infoLogo} alt="" className="info__logo" />
        </div>
        <div className="info__main">
          <div className="info__main_top">
            <div className="info__main_top_left">
              <h1 className="info__main_top_header">
                Отвечайте верно и&nbsp;выигрывайте призы!
              </h1>
              <span className="info__main_top_text">
                с&nbsp;00 по&nbsp;00&nbsp;сентября, наберите больше 3000&nbsp;очков, отвечая на&nbsp;вопросы
                своей игры, и&nbsp;участвуйте в&nbsp;розыгрыше
              </span>
            </div>
            <img src={chelik} alt="" className="info__main_top_right" />
          </div>
          <div className="info__main_bubbles">
            <div className="bubble wh">
              <span className="info__main_bubbles_blacktext">
                Подпишитесь на&nbsp;канал МТС&nbsp;РИИЛ
              </span>
              <span className="bubble_back-wh">#1</span>
              <button
                className="info__main_bubbles_redbtn"
                onClick={handleOpenRiil}
              >
                Подписаться
              </button>
            </div>
            <div className="bubble re">
              <span className="info__main_bubbles_whitetext">
                Наберите больше 3000&nbsp;очков, отвечая на&nbsp;вопросы правильно
              </span>
              <span className="bubble_back-re">#2</span>

            </div>
            <div className="bubble bl">
              <span className="info__main_bubbles_whitetext">
                00&nbsp;сентября подведем итоги в&nbsp;приложении и&nbsp;выберем 10&nbsp;победителей
              </span>
              <span className="bubble_back-bl">#3</span>

            </div>
          </div>

          <div className="info__slider">
            <h2 className="info__mid_prizes_title">
              Что можно <br />
              выиграть
            </h2>

            <div className="info__scroll_mid_prizes_slider">
              {prizes.map((prize) => (
                <div
                  className={`slider_item ${
                    prize.className ? `slider_item--${prize.className}` : ""
                  }`}
                  key={prize.id}
                >
                  <img
                    src={prize.image}
                    alt=""
                    className={`slider_item_img ${
                      prize.className
                        ? `slider_item_img--${prize.className}`
                        : ""
                    }`}
                  />

                  <span className="slider_item_name">{prize.name}</span>

                  <span className="slider_item_count">{prize.count}</span>
                </div>
              ))}
            </div>
            {!isQualifiedUser && (
              <div className="info__btn_red_wrapper">
                <button className="info__btn_red" onClick={handleStartGameClick}>
                  <span className="info__btn_red_text">Начать игру</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <section className="info__faq">
          <h2 className="info__faq_title">Ответы на&nbsp;частые вопросы</h2>

          <div className="info__faq_list">
            {faqItems.map((item) => {
              const isOpened = openedFaqId === item.id;

              return (
                <div
                  key={item.id}
                  className={`info__faq_item ${
                    isOpened ? "info__faq_item--opened" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="info__faq_head"
                    onClick={() => handleToggleFaq(item.id)}
                    aria-expanded={isOpened}
                  >
                    <span>{formatNbsp(item.title)}</span>
                    <span className="info__faq_icon">
                      {isOpened ? "−" : "+"}
                    </span>
                  </button>

                  <div className="info__faq_body">
                    <p className="info__faq_text">
                      {item.text.split("\n").map((line, index) => (
                        <span key={index}>
                          {formatNbsp(line)}
                          <br />
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="info__buttons">
          <button className="info__button red" onClick={handleOpenRiil}>
            Подключить тариф риил
          </button>
          <button className="info__button trans" onClick={handleOpenRiil}>
            Канал РИИЛ
          </button>
          <button
            className="info__button trans"
            onClick={() => setIsRulesModalOpen(true)}
          >
            Правила розыгрыша
          </button>
        </section>
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

export { Info };
export default Info;
