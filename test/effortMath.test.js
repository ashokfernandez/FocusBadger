import { describe, it, expect } from "./test-utils.js";
import {
  clampEffort,
  describeEffort,
  shouldCommitEffortChange,
  MIN_EFFORT,
  MAX_EFFORT
} from "../src/effortMath.js";

describe("effort math", () => {
  it("clamps values into the allowed range", () => {
    expect(clampEffort(null)).toBe(5);
    expect(clampEffort(0)).toBe(MIN_EFFORT);
    expect(clampEffort(3.4)).toBe(3);
    expect(clampEffort(11)).toBe(MAX_EFFORT);
  });

  it("describes effort bands for UI badges", () => {
    expect(describeEffort(null)).toEqual({ label: "Slide to set", colorScheme: "gray" });
    expect(describeEffort(2)).toEqual({ label: "Light lift", colorScheme: "green" });
    expect(describeEffort(6)).toEqual({ label: "In the zone", colorScheme: "yellow" });
    expect(describeEffort(10)).toEqual({ label: "Deep focus", colorScheme: "red" });
  });

  it("only signals commits when the rounded effort changes", () => {
    expect(shouldCommitEffortChange(5, 5.2)).toBe(false);
    expect(shouldCommitEffortChange(5, 6)).toBe(true);
    expect(shouldCommitEffortChange(MAX_EFFORT, 20)).toBe(false);
  });
});
