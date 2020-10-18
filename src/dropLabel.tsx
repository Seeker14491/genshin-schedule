import { useMemo } from "preact/hooks";
import {
  DayOfWeek,
  DaysOfWeek,
  DomainDropSet,
  DomainDropSets
} from "./db/domainDropSets";
import { Domains } from "./db/domains";
import { h } from "preact";

const DropLabel = ({ item }: { item: DomainDropSet["items"][0] }) => {
  const domain = useMemo(() => {
    const drops = DomainDropSets.find(d => d.items.includes(item));
    return drops && Domains.find(d => d.drops.includes(drops));
  }, [item]);

  const dropDays = useMemo(() => {
    const days = new Set<DayOfWeek>();

    if (domain) {
      for (const drops of domain.drops) {
        if (drops.items.includes(item)) {
          for (const day of drops.days) {
            days.add(day);
          }
        }
      }
    }

    return DaysOfWeek.filter(d => days.has(d));
  }, [domain, item]);

  if (!domain) {
    return null;
  }

  return (
    <div className="pl-12 mx-2 text-sm">
      <span className="align-middle">Dropped from </span>

      <a href={domain.wiki} className="font-bold">
        <img src="/assets/game/Domain.png" className="w-4 h-4 inline" />

        <span className="align-middle"> {domain.name}</span>
      </a>

      <span className="align-middle"> on {dropDays.join(", ")}</span>
    </div>
  );
};

export default DropLabel;
