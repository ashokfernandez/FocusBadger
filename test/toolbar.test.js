import { describe, it, expect } from "./test-utils.js";
import { ALL_PROJECTS, UNASSIGNED_LABEL } from "../src/matrix.js";
import {
  TOOLBAR_SORTS,
  buildProjectFilterOptions,
  compareProjectItems,
  sortProjectItems
} from "../src/toolbar.js";

describe("toolbar project filter options", () => {
  it("returns All plus unique project names and unassigned", () => {
    const options = buildProjectFilterOptions(["Alpha", "Beta", "Alpha"]);
    expect(options[0]).toBe(ALL_PROJECTS);
    expect(options.includes("Alpha")).toBe(true);
    expect(options.includes("Beta")).toBe(true);
    expect(options.at(-1)).toBe(UNASSIGNED_LABEL);
  });
});

describe("toolbar project sorting", () => {
  const sample = [
    { index: 0, task: { title: "Write docs", importance: 3, urgency: 2, effort: 1 } },
    { index: 1, task: { title: "Review PR", importance: 4, urgency: 4, effort: 1 } },
    { index: 2, task: { title: "Plan sprint", importance: 4, urgency: 1, effort: 3 } },
    { index: 3, task: { title: "Archive", done: true, importance: 5, urgency: 5, effort: 1 } }
  ];

  it("keeps incomplete tasks before completed ones", () => {
    const sorted = sortProjectItems(sample, TOOLBAR_SORTS.SCORE);
    expect(sorted.at(-1).task.done).toBe(true);
  });

  it("sorts by score descending when mode is score", () => {
    const sorted = sortProjectItems(sample, TOOLBAR_SORTS.SCORE);
    expect(sorted[0].task.title).toBe("Review PR");
  });

  it("sorts by due date ascending when mode is due date", () => {
    const items = [
      { index: 0, task: { title: "B", due: "2025-01-01" } },
      { index: 1, task: { title: "A", due: "2024-12-01" } },
      { index: 2, task: { title: "C" } }
    ];
    const sorted = sortProjectItems(items, TOOLBAR_SORTS.DUE_DATE);
    expect(sorted.map((item) => item.task.title)).toEqual(["A", "B", "C"]);
  });

  it("falls back to alphabetical ordering when titles differ", () => {
    const a = { index: 0, task: { title: "alpha" } };
    const b = { index: 1, task: { title: "Beta" } };
    const comparison = compareProjectItems(a, b, TOOLBAR_SORTS.TITLE);
    expect(comparison < 0).toBe(true);
  });
});
