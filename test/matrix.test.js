import { describe, it, expect } from "./test-utils.js";
import {
  ALL_PROJECTS,
  UNASSIGNED_LABEL,
  MATRIX_SORTS,
  LOW_EFFORT_MOOD_THRESHOLD,
  compareMatrixEntries,
  getProjectMoodHighlight,
  getTaskMoodHighlight,
  selectHighlightTaskIndexes,
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
  it("respects highlighted selection when provided for priority mode", () => {
    const highlightSet = new Set([2]);
    const task = { urgency: 4, importance: 5 };

    expect(
      getTaskMoodHighlight(task, MATRIX_SORTS.SCORE, {
        highlightedTaskIndexes: highlightSet,
        taskIndex: 2
      }).isPriorityHighlight
    ).toBe(true);

    expect(
      getTaskMoodHighlight(task, MATRIX_SORTS.SCORE, {
        highlightedTaskIndexes: highlightSet,
        taskIndex: 3
      }).isPriorityHighlight
    ).toBe(false);
  });

  it("ignores done tasks even when selected", () => {
    const highlightSet = new Set([1]);
    const doneTask = { urgency: 5, importance: 5, done: true };

    expect(
      getTaskMoodHighlight(doneTask, MATRIX_SORTS.SCORE, {
        highlightedTaskIndexes: highlightSet,
        taskIndex: 1
      }).isPriorityHighlight
    ).toBe(false);
  });

  it("treats due-today tasks as urgent when selection is not provided", () => {
    const now = new Date("2024-01-01T08:00:00Z");
    const dueToday = { due: "2024-01-01", importance: 4 };
    const { isPriorityHighlight } = getTaskMoodHighlight(dueToday, MATRIX_SORTS.SCORE, { now });
    expect(isPriorityHighlight).toBe(true);
  });

  it("respects highlighted selection for low effort mode", () => {
    const highlightSet = new Set([0]);
    const easyTask = { effort: LOW_EFFORT_MOOD_THRESHOLD, urgency: 3, importance: 2 };
    const harderTask = { effort: LOW_EFFORT_MOOD_THRESHOLD, urgency: 3, importance: 2 };

    expect(
      getTaskMoodHighlight(easyTask, MATRIX_SORTS.LOW_EFFORT, {
        highlightedTaskIndexes: highlightSet,
        taskIndex: 0
      }).isLowEffortHighlight
    ).toBe(true);

    expect(
      getTaskMoodHighlight(harderTask, MATRIX_SORTS.LOW_EFFORT, {
        highlightedTaskIndexes: highlightSet,
        taskIndex: 1
      }).isLowEffortHighlight
    ).toBe(false);
  });

  it("does not flag highlights when no mood is selected", () => {
    const sample = { urgency: 5, importance: 5, effort: 1 };
    const { isPriorityHighlight, isLowEffortHighlight } = getTaskMoodHighlight(sample, undefined);
    expect(isPriorityHighlight).toBe(false);
    expect(isLowEffortHighlight).toBe(false);
  });
});

describe("highlight selection", () => {
  it("picks the top five tasks by urgency, importance, then effort in priority mode", () => {
    const tasks = [
      { urgency: 5, importance: 5, effort: 5 }, // index 0
      { urgency: 3, importance: 4, effort: 2 }, // index 1
      { urgency: 5, importance: 2, effort: 1 }, // index 2
      { urgency: 2, importance: 5, effort: 1 }, // index 3
      { urgency: 5, importance: 5, effort: 10 }, // index 4
      { urgency: 4, importance: 3, effort: 1 } // index 5
    ];

    const selected = selectHighlightTaskIndexes(tasks, MATRIX_SORTS.SCORE);
    expect(Array.from(selected)).toEqual([0, 4, 2, 5, 1]);
    expect(selected.has(3)).toBe(false);
  });

  it("filters low effort tasks and respects project filters", () => {
    const tasks = [
      { urgency: 5, importance: 4, effort: 1, project: "Work" }, // idx0
      { urgency: 4, importance: 4, effort: 2, project: "Work" }, // idx1
      { urgency: 5, importance: 3, effort: 1, project: "Side" }, // idx2 excluded by filter
      { urgency: 3, importance: 5, effort: 2, project: "Work" }, // idx3
      { urgency: 4, importance: 2, effort: 1, project: "Work", done: true }, // idx4 done
      { urgency: 2, importance: 2, effort: 1, project: "Work" }, // idx5
      { urgency: 5, importance: 5, effort: LOW_EFFORT_MOOD_THRESHOLD + 1, project: "Work" } // idx6 effort too high
    ];

    const selected = selectHighlightTaskIndexes(tasks, MATRIX_SORTS.LOW_EFFORT, {
      filters: ["Work"],
      limit: 5
    });

    expect(Array.from(selected)).toEqual([0, 1, 3, 5]);
    expect(selected.has(2)).toBe(false);
    expect(selected.has(4)).toBe(false);
    expect(selected.has(6)).toBe(false);
  });
});

describe("project mood highlight", () => {
  it("surfaces priority highlight when any task qualifies", () => {
    const items = [
      { index: 1, task: { urgency: 1, importance: 1 } },
      { index: 2, task: { urgency: 5, importance: 5 } }
    ];

    const highlightSet = new Set([2]);
    const { hasPriorityHighlight, hasLowEffortHighlight } = getProjectMoodHighlight(
      items,
      MATRIX_SORTS.SCORE,
      { highlightedTaskIndexes: highlightSet }
    );

    expect(hasPriorityHighlight).toBe(true);
    expect(hasLowEffortHighlight).toBe(false);

    const { hasPriorityHighlight: missingHighlight } = getProjectMoodHighlight(
      items,
      MATRIX_SORTS.SCORE,
      { highlightedTaskIndexes: new Set() }
    );

    expect(missingHighlight).toBe(false);
  });

  it("surfaces low effort highlight when any task qualifies", () => {
    const items = [
      { index: 3, task: { urgency: 5, importance: 5, effort: LOW_EFFORT_MOOD_THRESHOLD + 2 } },
      { index: 4, task: { urgency: 1, importance: 1, effort: LOW_EFFORT_MOOD_THRESHOLD } }
    ];

    const { hasPriorityHighlight, hasLowEffortHighlight } = getProjectMoodHighlight(
      items,
      MATRIX_SORTS.LOW_EFFORT,
      { highlightedTaskIndexes: new Set([4]) }
    );

    expect(hasPriorityHighlight).toBe(false);
    expect(hasLowEffortHighlight).toBe(true);
  });

  it("ignores done tasks when computing highlights", () => {
    const items = [
      { index: 5, task: { urgency: 5, importance: 5, done: true } },
      { index: 6, task: { urgency: 2, importance: 2, effort: LOW_EFFORT_MOOD_THRESHOLD + 4 } }
    ];

    const { hasPriorityHighlight, hasLowEffortHighlight } = getProjectMoodHighlight(
      items,
      MATRIX_SORTS.SCORE,
      { highlightedTaskIndexes: new Set([5]) }
    );

    expect(hasPriorityHighlight).toBe(false);
    expect(hasLowEffortHighlight).toBe(false);
  });
});
