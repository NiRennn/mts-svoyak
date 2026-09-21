// Backgrounds & textures
import bgMain from "../assets/images/backgrounds/bg.jpg";
import bgLoader from "../assets/images/backgrounds/bg-loader.jpg";
// import bgMenu from "../assets/images/backgrounds/bg-menu.jpg";
import noise from "../assets/images/noise.png";

// Characters & illustrations
import validHost from "../assets/images/valid-kov.png";
import invalidHost from "../assets/images/invalid-kov.png";
import timeHost from "../assets/images/time-kov.png";
import modHost from "../assets/images/mod-kov.png";
import menuHost from "../assets/images/menu-kov.png";
import loaderHost from "../assets/images/loader-kov1.png";
import infoMan from "../assets/images/info-man.png";

// Game & UI graphics
import logoTop from "../assets/images/logo-top.png";
import prize from "../assets/images/prize.png";
import lead3000 from "../assets/images/lead3000.png";
import subBanner from "../assets/images/sub.png";
import smartPrize from "../assets/images/prizes/smart.png";
import pristavkaPrize from "../assets/images/prizes/pristavka.png";
import watchPrize from "../assets/images/prizes/watch.png";
import photoPrize from "../assets/images/prizes/photo.png";
import kolonkaPrize from "../assets/images/prizes/kolonka.png";

// Icons
import mtsLogo from "../assets/icons/mts-logo.svg";
import presentIcon from "../assets/icons/present.svg";
import leaderboardIcon from "../assets/icons/leaderboard.svg";
import playerIcon from "../assets/icons/player.png";
import round1Icon from "../assets/icons/round1.svg";
import round2Icon from "../assets/icons/round2.svg";
import gameCheckIcon from "../assets/icons/game-check.svg";
import gameCrossIcon from "../assets/icons/game-cross.svg";
import closeIcon from "../assets/icons/close.svg";
import infoIcon from "../assets/icons/info.svg";
import subNotFoundIcon from "../assets/icons/subnotfound.svg";
import winGrayIcon from "../assets/icons/win-gray.svg";

export const APP_PRELOAD_IMAGES: string[] = Array.from(
  new Set([
    // Most critical game host illustrations (must be ready immediately)
    validHost,
    invalidHost,
    timeHost,
    modHost,

    // Backgrounds & textures
    bgMain,
    bgLoader,
    noise,

    // Other characters & illustrations
    menuHost,
    loaderHost,
    infoMan,

    // Graphics
    logoTop,
    prize,
    lead3000,
    subBanner,
    smartPrize,
    pristavkaPrize,
    watchPrize,
    photoPrize,
    kolonkaPrize,

    // Icons
    mtsLogo,
    presentIcon,
    leaderboardIcon,
    playerIcon,
    round1Icon,
    round2Icon,
    gameCheckIcon,
    gameCrossIcon,
    closeIcon,
    infoIcon,
    subNotFoundIcon,
    winGrayIcon,
  ]),
);