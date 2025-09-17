export const MIN_EFFORT = 1;
export const MAX_EFFORT = 10;
export const DEFAULT_EFFORT = 5;

export function clampEffort(value, defaultValue = DEFAULT_EFFORT) {
  if (value == null || Number.isNaN(value)) return defaultValue;
  if (value < MIN_EFFORT) return MIN_EFFORT;
  if (value > MAX_EFFORT) return MAX_EFFORT;
  return Math.round(value);
}

export function describeEffort(value) {
  if (value == null) {
    return { label: "Slide to set", colorScheme: "gray" };
  }
  if (value <= 3) {
    return { label: "Light lift", colorScheme: "green" };
  }
  if (value <= 7) {
    return { label: "In the zone", colorScheme: "yellow" };
  }
  return { label: "Deep focus", colorScheme: "red" };
}

export function shouldCommitEffortChange(previous, next) {
  const current = clampEffort(previous);
  const proposed = clampEffort(next, current);
  return proposed !== current;
}
