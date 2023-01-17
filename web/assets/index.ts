// This file was generated using `yarn genassets`.
import BackgroundAyaka from "./game/BackgroundAyaka.png";
import BackgroundDiluc from "./game/BackgroundDiluc.png";
import BackgroundHuTao from "./game/BackgroundHuTao.png";
import BackgroundKazuha from "./game/BackgroundKazuha.png";
import BackgroundKlee from "./game/BackgroundKlee.png";
import BackgroundPaimon from "./game/BackgroundPaimon.png";
import BackgroundTartaglia from "./game/BackgroundTartaglia.png";
import BackgroundXiao from "./game/BackgroundXiao.png";
import BackgroundZhongli from "./game/BackgroundZhongli.png";
import RealmCurrency from "./game/Realm Currency.png";
import Resin from "./game/Resin.png";

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
    case "BackgroundAyaka": return BackgroundAyaka.src;
    case "BackgroundDiluc": return BackgroundDiluc.src;
    case "BackgroundHuTao": return BackgroundHuTao.src;
    case "BackgroundKazuha": return BackgroundKazuha.src;
    case "BackgroundKlee": return BackgroundKlee.src;
    case "BackgroundPaimon": return BackgroundPaimon.src;
    case "BackgroundTartaglia": return BackgroundTartaglia.src;
    case "BackgroundXiao": return BackgroundXiao.src;
    case "BackgroundZhongli": return BackgroundZhongli.src;
    case "Realm Currency": return RealmCurrency.src;
    case "Resin": return Resin.src;
  }
}
