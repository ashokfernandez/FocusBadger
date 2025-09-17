import { describe, it, expect } from "./test-utils.js";
import {
  ALL_PROJECTS,
  UNASSIGNED_LABEL,
  MATRIX_SORTS,
  compareMatrixEntries,
  normalizeProjectFilterKey,
  shouldIncludeTaskInMatrix,
  sortMatrixEntries
} from "../src/matrix.js";

describe("matrix filters", () => {
  it("normalizes project names", () => {
    expect(normalizeProjectFilterKey({ project: "Work" })).toBe("Work");
    expect(normalizeProjectFilterKey({ project: "  Focus  " })).toBe("Focus");
    expect(normalizeProjectFilterKey({ project: "" })).toBe(UNASSIGNED_LABEL);
    expect(normalizeProjectFilterKey({})).toBe(UNASSIGNED_LABEL);
  });

  it("includes task when filters empty", () => {
    expect(shouldIncludeTaskInMatrix({ project: "Work" }, [])).toBe(true);
  });

  it("respects all projects toggle", () => {
    expect(shouldIncludeTaskInMatrix({ project: "Work" }, [ALL_PROJECTS])).toBe(true);
  });

  it("matches individual project filters", () => {
    expect(shouldIncludeTaskInMatrix({ project: "Work" }, ["Work"])).toBe(true);
    expect(shouldIncludeTaskInMatrix({ project: "Home" }, ["Work"])).toBe(false);
  });

  it("handles unassigned label", () => {
    expect(shouldIncludeTaskInMatrix({ project: undefined }, [UNASSIGNED_LABEL])).toBe(true);
    expect(shouldIncludeTaskInMatrix({ project: "" }, [UNASSIGNED_LABEL])).toBe(true);
  });
});

describe("matrix sorting", () => {
  const wrap = (task) => ({ task });

  it("sorts by score when no mode provided", () => {
    const items = [
      wrap({ title: "Charlie", importance: 1, urgency: 3, effort: 1 }),
      wrap({ title: "Alpha", importance: 2, urgency: 1, effort: 1 }),
      wrap({ title: "Bravo", importance: 3, urgency: 0, effort: 3 })
    ];

    const sorted = sortMatrixEntries(items);
    expect(sorted.map((entry) => entry.task.title)).toEqual([
      "Alpha",
      "Charlie",
      "Bravo"
    ]);
  });

  it("surfaces lower effort tasks first when requested", () => {
    const items = [
      wrap({ title: "Heavy", effort: 7, importance: 4, urgency: 4 }),
      wrap({ title: "Light", effort: 2, importance: 1, urgency: 1 }),
      wrap({ title: "Focus", effort: 4, importance: 4, urgency: 2 }),
      wrap({ title: "Unknown", importance: 5, urgency: 5 })
    ];

    const sorted = sortMatrixEntries(items, MATRIX_SORTS.LOW_EFFORT);
    expect(sorted.map((entry) => entry.task.title)).toEqual([
      "Light",
      "Focus",
      "Heavy",
      "Unknown"
    ]);
  });

  it("falls back to score ordering for equal effort values", () => {
    const sample = [
      wrap({ title: "Gamma", effort: 3, importance: 2, urgency: 1 }),
      wrap({ title: "Delta", effort: 3, importance: 3, urgency: 2 })
    ];

    const diff = compareMatrixEntries(sample[0], sample[1], MATRIX_SORTS.LOW_EFFORT);
    expect(Math.sign(diff)).toBeGreaterThan(0);
  });
});
