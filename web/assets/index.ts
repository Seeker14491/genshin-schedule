import BackgroundAyaka from "./game/BackgroundAyaka.webp";
import BackgroundDiluc from "./game/BackgroundDiluc.webp";
import BackgroundHuTao from "./game/BackgroundHuTao.webp";
import BackgroundKazuha from "./game/BackgroundKazuha.webp";
import BackgroundKlee from "./game/BackgroundKlee.webp";
import BackgroundPaimon from "./game/BackgroundPaimon.webp";
import BackgroundTartaglia from "./game/BackgroundTartaglia.webp";
import BackgroundXiao from "./game/BackgroundXiao.webp";
import BackgroundZhongli from "./game/BackgroundZhongli.webp";
import RealmCurrency from "./game/Realm Currency.webp";
import Resin from "./game/Resin.webp";

export {
  BackgroundAyaka,
  BackgroundDiluc,
  BackgroundHuTao,
  BackgroundKazuha,
  BackgroundKlee,
  BackgroundPaimon,
  BackgroundTartaglia,
  BackgroundXiao,
  BackgroundZhongli,
  RealmCurrency,
  Resin,
};

export function getAssetByName(name: string): string | undefined {
  switch (name) {
    case "BackgroundAyaka":
      return BackgroundAyaka.src;
    case "BackgroundDiluc":
      return BackgroundDiluc.src;
    case "BackgroundHuTao":
      return BackgroundHuTao.src;
    case "BackgroundKazuha":
      return BackgroundKazuha.src;
    case "BackgroundKlee":
      return BackgroundKlee.src;
    case "BackgroundPaimon":
      return BackgroundPaimon.src;
    case "BackgroundTartaglia":
      return BackgroundTartaglia.src;
    case "BackgroundXiao":
      return BackgroundXiao.src;
    case "BackgroundZhongli":
      return BackgroundZhongli.src;
    case "Realm Currency":
      return RealmCurrency.src;
    case "Resin":
      return Resin.src;
  }
}
