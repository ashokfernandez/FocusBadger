import { describe, it, expect } from "./test-utils.js";
import {
  ALL_PROJECTS,
  UNASSIGNED_LABEL,
  MATRIX_SORTS,
  LOW_EFFORT_MOOD_THRESHOLD,
  compareMatrixEntries,
  getTaskMoodHighlight,
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
    expect(Math.sign(diff) > 0).toBe(true);
  });
});

describe("task mood highlight", () => {
  it("highlights only urgent and important tasks in priority mode", () => {
    const urgentImportant = { urgency: 4, importance: 5 };
    const lowPriority = { urgency: 1, importance: 1 };
    const doneTask = { urgency: 5, importance: 5, done: true };

    expect(getTaskMoodHighlight(urgentImportant, MATRIX_SORTS.SCORE).isPriorityHighlight).toBe(true);
    expect(getTaskMoodHighlight(lowPriority, MATRIX_SORTS.SCORE).isPriorityHighlight).toBe(false);
    expect(getTaskMoodHighlight(doneTask, MATRIX_SORTS.SCORE).isPriorityHighlight).toBe(false);
  });

  it("treats due-today tasks as urgent when mood is priority", () => {
    const now = new Date("2024-01-01T08:00:00Z");
    const dueToday = { due: "2024-01-01", importance: 4 };
    const { isPriorityHighlight } = getTaskMoodHighlight(dueToday, MATRIX_SORTS.SCORE, { now });
    expect(isPriorityHighlight).toBe(true);
  });

  it("highlights tasks with effort below the low effort threshold", () => {
    const easyTask = { effort: LOW_EFFORT_MOOD_THRESHOLD, urgency: 1, importance: 1 };
    const mediumTask = { effort: LOW_EFFORT_MOOD_THRESHOLD + 1, urgency: 4, importance: 4 };
    const missingEffort = { urgency: 5, importance: 5 };

    expect(getTaskMoodHighlight(easyTask, MATRIX_SORTS.LOW_EFFORT).isLowEffortHighlight).toBe(true);
    expect(getTaskMoodHighlight(mediumTask, MATRIX_SORTS.LOW_EFFORT).isLowEffortHighlight).toBe(false);
    expect(getTaskMoodHighlight(missingEffort, MATRIX_SORTS.LOW_EFFORT).isLowEffortHighlight).toBe(false);
  });

  it("does not flag highlights when no mood is selected", () => {
    const sample = { urgency: 5, importance: 5, effort: 1 };
    const { isPriorityHighlight, isLowEffortHighlight } = getTaskMoodHighlight(sample, undefined);
    expect(isPriorityHighlight).toBe(false);
    expect(isLowEffortHighlight).toBe(false);
  });
});
