import type { Background } from "#lib/utils/config.ts";
import BackgroundAyaka from "./game/BackgroundAyaka.webp";
import BackgroundDiluc from "./game/BackgroundDiluc.webp";
import BackgroundHuTao from "./game/BackgroundHuTao.webp";
import BackgroundKazuha from "./game/BackgroundKazuha.webp";
import BackgroundKlee from "./game/BackgroundKlee.webp";
import BackgroundPaimon from "./game/BackgroundPaimon.webp";
import BackgroundTartaglia from "./game/BackgroundTartaglia.webp";
import BackgroundXiao from "./game/BackgroundXiao.webp";
import BackgroundZhongli from "./game/BackgroundZhongli.webp";

export { default as PaimonIcon } from "./PaimonIcon.webp";
export { default as RealmCurrencyIcon } from "./game/Realm Currency.webp";
export { default as ResinIcon } from "./game/Resin.webp";

export const BackgroundImages: Record<Background, string> = {
  paimon: BackgroundPaimon,
  klee: BackgroundKlee,
  diluc: BackgroundDiluc,
  tartaglia: BackgroundTartaglia,
  zhongli: BackgroundZhongli,
  xiao: BackgroundXiao,
  hutao: BackgroundHuTao,
  kazuha: BackgroundKazuha,
  ayaka: BackgroundAyaka,
};
