import "./End.scss";

import mtsLogo from "../../assets/icons/mts-logo.svg";
import win from "../../assets/icons/present.svg";
import wingray from "../../assets/icons/win-gray.svg";

import { useAppStore } from "../../store/appStore";
import type { WinnerDto } from "../../store/appStore";
import { isMobileTelegram } from "../../utils/telegramPlatform";

function End() {
  const isMobile = isMobileTelegram();
  const user = useAppStore((state) => state.user);
  const winners = useAppStore((state) => state.winners);

  const sortedWinners = [...winners].sort((a, b) => a.place - b.place);

  const handleWinnerClick = () => {
    const tg = (window as any)?.Telegram?.WebApp;
    const vkUrl = "https://vk.com/mts";

    if (tg?.openLink) {
      tg.openLink(vkUrl);
      return;
    }

    window.open(vkUrl, "_blank", "noopener,noreferrer");
  };

  const getWinnerUsername = (winner: WinnerDto) => {
    if (winner.username) {
      return winner.username.startsWith("@")
        ? winner.username
        : `@${winner.username}`;
    }

    if (winner.first_name) {
      return winner.first_name;
    }

    return `ID ${winner.tg_id ?? winner.user_id}`;
  };

  return (
    <div
      className={`end ${isMobile ? "end--mobile" : "end--desktop"}`}
      data-platform={isMobile ? "mobile" : "desktop"}
    >
      <div className="end__content">
        <img src={mtsLogo} alt="" className="end__content_top_logo" />

        <div className="end__content_bot">
          <div className="end__content_mid">
            <h1 className="end__content_mid_title">
              Игра завершена&nbsp;— подводим итоги и&nbsp;поздравляем победителей!
            </h1>
            <p className="end__content_mid_subtitle">
              Если ты&nbsp;нашел себя в&nbsp;списке призеров, напиши нам в&nbsp;личные
              сообщения сообщества МТС в&nbsp;ВК. Укажи свое ФИО и&nbsp;название приза&nbsp;—
              мы&nbsp;свяжемся с&nbsp;тобой и&nbsp;расскажем, как&nbsp;его получить. Спасибо
              за&nbsp;участие!
            </p>
            <button
              onClick={handleWinnerClick}
              className="end__content_mid_btn"
            >
              Я победитель!
            </button>
          </div>

          <div className="end__content_bot_list">
            {sortedWinners.map((winnerItem) => {
              const currentUserId = user?.tg_id ?? user?.user_id;
              const winnerUserId = winnerItem.tg_id ?? winnerItem.user_id;
              const isCurrentUserWinner =
                currentUserId !== undefined &&
                winnerUserId !== undefined &&
                currentUserId === winnerUserId;

              return (
                <div
                  key={`${winnerItem.place}-${winnerUserId ?? winnerItem.username}`}
                  className={`list_item ${
                    isCurrentUserWinner ? "list_item--current-user" : ""
                  }`}
                >
                  <div
                    className={`list_item_place ${
                      isCurrentUserWinner
                        ? "list_item_place--current-user"
                        : ""
                    }`}
                  >
                    {winnerItem.place}
                  </div>

                  <div className="list_item_content">
                    <p className="list_item_username">
                      {getWinnerUsername(winnerItem)}
                    </p>

                    <div className="list_item_wrap">
                      <img
                        src={isCurrentUserWinner ? win : wingray}
                        alt=""
                        className="list_item_prize"
                      />

                      <p className="list_item_label">{winnerItem.prize}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {!sortedWinners.length && (
              <p className="end__content_bot_empty">
                Победители пока не&nbsp;найдены
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default End;
