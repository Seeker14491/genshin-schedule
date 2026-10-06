/** Resin recharges up to this amount. */
export const ResinCap = 200;
/** The most resin there can be. Going above the cap is only possible by adding resin, e.g. from Fragile Resin. */
export const ResinMax = 2000;
export const ResinPerMinute = 1 / 8;

export function getResinRecharge(ms: number) {
  return (ms / 60000) * ResinPerMinute;
}

/**
 * Resin at a given time, from the resin at the time of the last change. Times before the change count as the time of
 * the change. Resin recharges until it reaches the cap, and doesn't recharge at all while it's above the cap.
 */
export function getResinAt(resin: { value: number; time: number }, ms: number) {
  if (resin.value >= ResinCap) {
    return resin.value;
  }

  return Math.min(ResinCap, resin.value + getResinRecharge(Math.max(0, ms - resin.time)));
}

/** When resin recharges to `value`, from the resin at the time of the last change. Only meaningful below the cap. */
export function getResinTime(resin: { value: number; time: number }, value: number) {
  return resin.time + ((value - resin.value) / ResinPerMinute) * 60000;
}

/** Adds resin (or subtracts it, if `delta` is negative). Returns undefined if the result would be below 0 or above the maximum. */
export function addResin(value: number, delta: number) {
  const result = value + delta;

  if (result < 0 || result > ResinMax) {
    return undefined;
  }

  // like in the game, progress towards the next resin is lost once the cap is reached
  return result >= ResinCap ? Math.floor(result) : result;
}

export function clampResin(value: number) {
  return Math.max(0, Math.min(ResinMax, value));
}

export function roundResin(value: number) {
  return Math.floor(clampResin(value));
}

/** Values resin calculator buttons can be chosen from: subtracting or adding 10 to 90 resin, like the keyboard shortcuts. */
export const ResinButtonValues = [-90, -80, -70, -60, -50, -40, -30, -20, -10, 10, 20, 30, 40, 50, 60, 70, 80, 90];

/** Resin calculator buttons in the order they're shown: from lowest to highest, without duplicates. */
export function sortResinButtons(values: readonly number[]) {
  return [...new Set(values)].sort((a, b) => a - b);
}

/** The text of a resin calculator button, e.g. "-20" or "+60". */
export function formatResinButton(delta: number) {
  return delta > 0 ? `+${delta}` : `${delta}`;
}
