export const ResinCap = 200;
export const ResinsPerMinute = 1 / 8;

export function getResinRecharge(ms: number) {
  return (ms / 60000) * ResinsPerMinute;
}

export function clampResin(value: number) {
  return Math.max(0, Math.min(ResinCap, value));
}

export function roundResin(value: number) {
  return Math.floor(clampResin(value));
}

/** Parses a comma-separated list like "-40, -20, +10" into resin calculator button values, ignoring invalid ones. */
export function parseResinButtons(text: string) {
  const values: number[] = [];

  for (const part of text.split(",")) {
    const parsed = parseInt(part);

    // value must be an integer and multiple of ten (for keyboard shortcuts),
    // and within the resin cap just to make sure we are dealing with sane inputs
    if (Number.isInteger(parsed) && parsed % 10 === 0 && Math.abs(parsed) < ResinCap) {
      values.push(parsed);
    }
  }

  return values;
}
