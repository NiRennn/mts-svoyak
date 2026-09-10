import { useState } from "react";
import "./Sub.scss";
import { useNavigate } from "react-router-dom";

import { useAppStore } from "../../store/appStore";
import { checkUserSubscription } from "../../api/subscription";
import appRoutes from "../../routes/routes";

import subLogo from "../../assets/images/sub.png";
import notFound from "../../assets/icons/subnotfound.svg";
import logo from "../../assets/icons/mts-logo.svg";

type CheckStatus = "idle" | "checking" | "not-found";

const CHANNEL_URL = "https://t.me/+X_Y-xncYDCAzZTJi";

function Sub() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const [checkStatus, setCheckStatus] = useState<CheckStatus>("idle");

  const handleOpenChannel = () => {
    const tg = (window as any)?.Telegram?.WebApp;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(CHANNEL_URL);
      return;
    }

    window.open(CHANNEL_URL, "_blank", "noopener,noreferrer");
  };

  const handleCheckSubscription = async () => {
    const userId = user?.tg_id ?? user?.user_id;

    if (!userId) {
      console.error("user_id not found");
      setCheckStatus("not-found");
      return;
    }

    setCheckStatus("checking");

    try {
      const result = await checkUserSubscription(userId);

      if (result?.subs) {
        setCheckStatus("idle");
        navigate(appRoutes.MENU, { replace: true });
        return;
      }

      setCheckStatus("not-found");
    } catch (error) {
      console.error("Error checking subscription:", error);
      setCheckStatus("not-found");
    }
  };

  const handleCloseNotFound = () => {
    setCheckStatus("idle");
  };

  return (
    <div className="sub">
      <div className="sub__content">
        <img src={logo} alt="" className="sub__top_logo" />
        <div className="sub__mid_wrapper">
          <div className="sub__mid">
            <img src={subLogo} alt="" className="sub__mid_logo" />
            <h1 className="sub__mid_h">Подпишись на&nbsp;наш канал</h1>
            <p className="sub__mid_p">
              Игра доступна подписчикам Telegram-канала РИИЛ МТС. Проверим
              подписку и&nbsp;сразу откроем игровое поле.
            </p>
          </div>
        </div>

        <div className="sub__btn_block">
          <button className="sub__btn_red" onClick={handleOpenChannel}>
            <span className="sub__btn_red_text">Перейти в&nbsp;канал</span>
          </button>
          <button
            className="sub__btn_gray"
            onClick={handleCheckSubscription}
            disabled={checkStatus === "checking"}
          >
            <span className="sub__btn_gray_text">Проверить</span>
          </button>
        </div>
      </div>
      {checkStatus !== "idle" && (
        <div
          className={`sub__checking ${
            checkStatus === "not-found" ? "sub__checking--not-found" : ""
          }`}
        >
          {checkStatus === "checking" && (
            <>
              <div className="sub__checking_spinner"></div>
              <p className="sub__checking_text">
                Проверяем <br />
                подписку
              </p>
            </>
          )}

          {checkStatus === "not-found" && (
            <div className="sub__notfound">
              <div className="sub__notfound_cross_wrapper">
                <img src={notFound} alt="" className="sub__notfound_cross" />
              </div>

              <div className="sub__notfound_bottom">
                <div className="sub__notfound_bottom_text-block">
                  <h1 className="sub__notfound_bottom_h">
                    Подписка не&nbsp;найдена!
                  </h1>
                  <p className="sub__notfound_bottom_p">
                    Мы&nbsp;не&nbsp;смогли найти вашу подписку на&nbsp;канал МТС&nbsp;РИИЛ. Повторите
                    попытку еще&nbsp;раз!
                  </p>
                </div>

                <button className="sub__btn_red" onClick={handleCloseNotFound}>
                  <span className="sub__btn_red_text">Повторить</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Sub;
