import "./Leaderboard.scss";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import appRoutes from "../../routes/routes";
import { useAppStore } from "../../store/appStore";
import { fetchLeaderboard } from "../../api/leaderboard";
import type { LeaderboardResponse } from "../../api/leaderboard";

import logo from "../../assets/icons/mts-logo.svg";
import info from "../../assets/icons/info.svg";
import lead from "../../assets/images/lead3000.png";
import playerIcon from "../../assets/icons/player.png";

function Leaderboard() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);

  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const hasQualified = useAppStore((state) => state.has_qualified);
  const canPlay = useAppStore((state) => state.can_play);
  const attempt = useAppStore((state) => state.attempt);
  const bestPoints = useAppStore((state) => state.best_points);
  const qualifyThreshold = useAppStore((state) => state.qualify_threshold);
  const storeAnsweredIds = useAppStore((state) => state.answered_question_ids);

  const isQualifiedUser =
    hasQualified ||
    ((bestPoints ?? 0) >= (qualifyThreshold || 3000)) ||
    ((attempt?.total_points ?? 0) >= (qualifyThreshold || 3000) &&
      (Boolean(attempt?.is_finished) || (storeAnsweredIds?.length ?? 0) >= 75)) ||
    (!canPlay &&
      Math.max(bestPoints ?? 0, attempt?.total_points ?? 0) >=
        (qualifyThreshold || 3000));

  // Telegram BackButton support
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

  // Fetch leaderboard data
  useEffect(() => {
    let isCancelled = false;

    const loadLeaderboard = async () => {
      setIsLoading(true);
      setError(null);

      const userId = user?.tg_id ?? user?.user_id ?? 0;

      try {
        const res = await fetchLeaderboard(userId, 100);
        if (!isCancelled) {
          setData(res);
        }
      } catch (err: any) {
        console.error("Failed to load leaderboard:", err);
        if (!isCancelled) {
          setError("Не удалось загрузить таблицу лидеров");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  return (
    <div className="leaderboards">
      <img src={logo} alt="МТС" className="leaderboards__logo" />

      <div className="leaderboards__main">
        <h1 className="leaderboards__main_header">Таблица лидеров</h1>

        <div className="leaderboards__main_info">
          <div className="leaderboards__main_info_left">
            <img
              src={info}
              alt="info"
              className="leaderboards__main_info_left_icon"
            />
            <span className="leaderboards__main_info_left_text">
              Наберите больше {data?.threshold ?? 3000}&nbsp;очков, чтобы принять
              участие в&nbsp;розыгрыше
            </span>
          </div>
          <img
            src={lead}
            alt="3000"
            className="leaderboards__main_info_right"
          />
        </div>

        {/* CURRENT USER ITEM */}
        {data?.me && (
          <div className="leaderboards__my_item">
            <div className="leaderboards__item_left">
              <img
                src={playerIcon}
                alt="avatar"
                className="leaderboards__item_avatar"
              />
              <span className="leaderboards__item_rank">
                №{data.me.rank}
              </span>
              <span className="leaderboards__item_username">
                {data.me.username
                  ? data.me.username.startsWith("@")
                    ? data.me.username
                    : `@${data.me.username}`
                  : "ЭТО ВЫ"}
              </span>

            </div>

            <div className="leaderboards__item_score_pill">
              {data.me.score}
            </div>
          </div>
        )}

        {/* LEADERBOARD LIST */}
        <div className="leaderboards__list">
          {isLoading && (
            <div className="leaderboards__loading">
              <div className="leaderboards__spinner"></div>
              <span>Загрузка лидеров...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="leaderboards__error">{error}</div>
          )}

          {!isLoading &&
            !error &&
            data?.top &&
            data.top.map((item) => {
              const isCurrentUser =
                user && (user.tg_id === item.user_id || user.user_id === item.user_id);

              return (
                <div
                  key={`${item.rank}-${item.user_id}`}
                  className={`leaderboards__item ${
                    isCurrentUser ? "leaderboards__item--me" : ""
                  }`}
                >
                  <div className="leaderboards__item_left">
                    <img
                      src={playerIcon}
                      alt="avatar"
                      className="leaderboards__item_avatar"
                    />
                    <span className="leaderboards__item_rank">
                      №{item.rank}
                    </span>
                    <span className="leaderboards__item_username">
                      {item.username
                        ? item.username.startsWith("@")
                          ? item.username
                          : `@${item.username}`
                        : "Участник"}
                    </span>
                  </div>

                  <div className="leaderboards__item_score_pill">
                    {item.score}
                  </div>
                </div>
              );
            })}

          {!isLoading && !error && (!data?.top || data.top.length === 0) && (
            <div className="leaderboards__empty">Список лидеров пока пуст</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
