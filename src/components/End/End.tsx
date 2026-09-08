import "./End.scss";

import mtsLogo from "../../assets/icons/mts-logo.svg";
import win from "../../assets/icons/present.svg";
import gray from "../../assets/icons/win-gray.svg";

import { useAppStore } from "../../store/appStore";

function End() {
  const user = useAppStore((state) => state.user);
  const winners = useAppStore((state) => state.winners);

  //   const sortedWinners = [...winners].sort((a, b) => a.place - b.place);

  const handleWinnerClick = () => {
    const tg = (window as any)?.Telegram?.WebApp;
    const vkUrl = "https://vk.com/mts";

    if (tg?.openLink) {
      tg.openLink(vkUrl);
      return;
    }

    window.open(vkUrl, "_blank", "noopener,noreferrer");
  };

  const getWinnerUsername = (winner: (typeof winners)[number]) => {
    if (winner.username) {
      return `@${winner.username}`;
    }

    if (winner.first_name) {
      return winner.first_name;
    }

    return `ID ${winner.user_id}`;
  };

  return (
    <div className="end">
      <div className="end__content">
        <img src={mtsLogo} alt="" className="end__content_top_logo" />
        <div className="end__content_mid">
          <h1 className="end__content_mid_title">
            Игра завершена – подводим итоги и поздравляем победителей!
          </h1>
          <p className="end__content_mid_subtitle">
            Если ты нашел себя в списке призеров, напиши нам в личные сообщения
            сообщества МТС в ВК. Укажи свое ФИО и название приза — мы свяжемся
            с тобой и расскажем, как его получить. Спасибо за участие!
          </p>
          <div className="end__content_mid_btn">
            <button onClick={handleWinnerClick}>Я победитель!</button>
          </div>
        </div>
        {/* <div className="end__content_bot_y">
          <div className="end__content_bot">
            <div className="end__content_bot_list">
              {sortedWinners.map((winnerItem) => {
                const isCurrentUserWinner =
                  user?.user_id === winnerItem.user_id;

                return (
                  <div
                    key={`${winnerItem.place}-${winnerItem.user_id}`}
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
                  Победители пока не найдены
                </p>
              )}
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default End;
