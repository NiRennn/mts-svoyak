import "./Info.scss";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import appRoutes from "../../routes/routes";
import { useAppStore } from "../../store/appStore";
import { acceptRules } from "../../api/rules";
import { formatNbsp } from "../../utils/typography";

import closeIcon from "../../assets/icons/close.svg";
import infoLogo from "../../assets/images/logo-top.png";
import logo from "../../assets/icons/mts-logo.svg";
import chelik from "../../assets/images/info-man.png";
import { isMobileTelegram } from "../../utils/telegramPlatform";

import kolonka from '../../assets/images/prizes/kolonka.png'
import photo from '../../assets/images/prizes/photo.png'
import pristavka from '../../assets/images/prizes/pristavka.png'
import smart from '../../assets/images/prizes/smart.png'
import watch from '../../assets/images/prizes/watch.png'

type FaqItem = {
  id: number;
  title: string;
  text: string;
};

const faqItems: FaqItem[] = [
  {
    id: 1,
    title: "Как\u00A0принять участие в\u00A0розыгрыше?",
    text: "Нужно подписаться на\u00A0телеграмм-канал РИИЛ и\u00A0пройти игру, набрав от\u00A02.000\u00A0баллов и\u00A0став одним из\u00A0топ 10\u00A0игроков. Игру можно пройти два раза, а\u00A0засчитается наилучший результат.",
  },
  {
    id: 2,
    title: "Кто организатор розыгрыша",
    text: "Все подробности смотри в\u00A0правилах розыгрыша по\u00A0ссылке",
  },
  {
    id: 3,
    title: "Что можно выиграть?",
    text: "Пройди игру, набери максимум баллов и\u00A0получи шанс выиграть один из\u00A0призов: фотоаппарат моментальной печати, портативную колонку, смарт-часы, игровую консоль или\u00A0смартфон.",
  },
];

const prizes = [
  {
    id: 1,
    image: smart,
    name: "Смартфон",
    count: "1 место",
    className: "smart",
  },
  {
    id: 2,
    image: pristavka,
    name: "Игровая консоль",
    count: "2 место",
    className: "pristavka",
  },
  {
    id: 3,
    image: watch,
    name: "Смарт-часы",
    count: "3-5 место",
    className: "watch",
  },
  {
    id: 4,
    image: photo,
    name: "Моментальный фотоаппарат",
    count: "6-7 место",
    className: "photo",
  },
  {
    id: 5,
    image: kolonka,
    name: "Портативная колонка",
    count: "8-10 место",
    className: "kolonka",
  },
];

const CHANNEL_URL = "https://t.me/eto_riil";
const CHANNEL_URL_TARIF = "https://mts.ru/riil?utm_source=mrk_sp&utm_medium=banner&utm_campaign=msc_mts_riil_q3_26&utm_term=app_knopka_glavnay";
const RULES_URL = "https://drive.google.com/file/d/1NBipMZz2ESikcH0nBw8h96AsxBldFCKz/view";

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
        ((a.total_points ?? 0) >= (qualifyThreshold || 2000) ||
          (bestPoints ?? 0) >= (qualifyThreshold || 2000)),
    );

  const isQualifiedUser =
    hasQualified ||
    hasFinishedQualifiedAttempt ||
    (isCurrentAttemptFinished &&
      ((attempt?.total_points ?? 0) >= (qualifyThreshold || 2000) ||
        (bestPoints ?? 0) >= (qualifyThreshold || 2000))) ||
    (!canPlay &&
      Math.max(bestPoints ?? 0, attempt?.total_points ?? 0) >=
        (qualifyThreshold || 2000));

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

  // Drag-to-scroll for prizes slider
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const [isSliderDragging, setIsSliderDragging] = useState(false);

  const handleSliderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const slider = sliderRef.current;
    if (!slider) return;

    isDraggingRef.current = true;
    setIsSliderDragging(true);

    startXRef.current = e.pageX;
    scrollLeftRef.current = slider.scrollLeft;

    lastXRef.current = e.pageX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;

    slider.style.scrollSnapType = "none";
    slider.style.scrollBehavior = "auto";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !sliderRef.current) return;
      e.preventDefault();

      const currentX = e.pageX;
      const dx = currentX - startXRef.current;
      sliderRef.current.scrollLeft = scrollLeftRef.current - dx;

      const now = performance.now();
      const dt = now - lastTimeRef.current;
      if (dt > 10) {
        velocityRef.current = (currentX - lastXRef.current) / dt;
        lastXRef.current = currentX;
        lastTimeRef.current = now;
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsSliderDragging(false);

      const slider = sliderRef.current;
      if (!slider) return;

      const velocity = velocityRef.current;
      if (Math.abs(velocity) > 0.2) {
        const momentum = -velocity * 180;
        slider.scrollBy({ left: momentum, behavior: "smooth" });
      }

      setTimeout(() => {
        if (sliderRef.current) {
          sliderRef.current.style.scrollSnapType = "";
          sliderRef.current.style.scrollBehavior = "";
        }
      }, 50);
    };

    if (isSliderDragging) {
      window.addEventListener("mousemove", handleMouseMove, { passive: false });
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isSliderDragging]);

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
  const handleOpenTarif = () => {
    const tg = (window as any)?.Telegram?.WebApp;

    if (tg?.openLink) {
      tg.openLink(CHANNEL_URL_TARIF);
      return;
    }

    window.open(CHANNEL_URL_TARIF, "_blank", "noopener,noreferrer");
  };

  const handleOpenRules = () => {
    const tg = (window as any)?.Telegram?.WebApp;

    if (tg?.openLink) {
      tg.openLink(RULES_URL);
      return;
    }

    window.open(RULES_URL, "_blank", "noopener,noreferrer");
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
          <img src={logo} alt="" className="info__logo_mts" />
          <img src={infoLogo} alt="" className="info__logo" />
        </div>
        <div className="info__main">
          <div className="info__main_top">
            <div className="info__main_top_left">
              <h1 className="info__main_top_header">
                Отвечайте верно и&nbsp;выигрывайте призы!
              </h1>
              <span className="info__main_top_text">
                с&nbsp;27&nbsp;сентября по&nbsp;15&nbsp;октября играйте
                в&nbsp;игру, набирайте больше 2000&nbsp;очков и&nbsp;участвуйте
                в&nbsp;розыгрыше призов
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
                Наберите больше 2000&nbsp;очков, отвечая на&nbsp;вопросы
                правильно
              </span>
              <span className="bubble_back-re">#2</span>
            </div>
            <div className="bubble bl">
              <span className="info__main_bubbles_whitetext">
                19&nbsp;октября подведем итоги в&nbsp;приложении и&nbsp;выберем
                10&nbsp;победителей
              </span>
              <span className="bubble_back-bl">#3</span>
            </div>
          </div>

          <div className="info__slider">
            <h2 className="info__mid_prizes_title">
              Что можно <br />
              выиграть
            </h2>

            <div
              ref={sliderRef}
              className={`info__scroll_mid_prizes_slider ${
                isSliderDragging ? "info__scroll_mid_prizes_slider--dragging" : ""
              }`}
              onMouseDown={handleSliderMouseDown}
            >
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
                    className={`slider_item_img ${prize.className || ""} ${
                      prize.className
                        ? `slider_item_img--${prize.className}`
                        : ""
                    }`.trim()}
                  />

                  <span className="slider_item_name">{prize.name}</span>

                  <span className="slider_item_count">{prize.count}</span>
                </div>
              ))}
            </div>
            {!isQualifiedUser && (
              <div className="info__btn_red_wrapper">
                <button
                  className="info__btn_red"
                  onClick={handleStartGameClick}
                >
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
                      {item.id === 2 ? (
                        <>
                          Все подробности смотри в&nbsp;правилах розыгрыша по&nbsp;
                          <a
                            href={RULES_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="info__faq_link"
                            onClick={(e) => {
                              e.preventDefault();
                              handleOpenRules();
                            }}
                          >
                            ссылке
                          </a>
                        </>
                      ) : (
                        item.text.split("\n").map((line, index) => (
                          <span key={index}>
                            {formatNbsp(line)}
                            <br />
                          </span>
                        ))
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="info__buttons">
          <button className="info__button red" onClick={handleOpenTarif}>
            Подключить тариф риил
          </button>
          <button className="info__button trans" onClick={handleOpenRiil}>
            Канал РИИЛ
          </button>
          <button
            className="info__button trans"
            onClick={handleOpenRules}
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
              Отвечайте на&nbsp;вопросы и&nbsp;зарабатывайте очки, наберите
              больше 2000&nbsp;очков и&nbsp;участвуйте в&nbsp;розыгрыше
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
                  href={RULES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu_rules_modal__link"
                  onClick={(e) => {
                    e.stopPropagation();
                    const tg = (window as any)?.Telegram?.WebApp;
                    if (tg?.openLink) {
                      e.preventDefault();
                      tg.openLink(RULES_URL);
                    }
                  }}
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
