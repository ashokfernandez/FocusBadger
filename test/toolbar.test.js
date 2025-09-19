import { describe, it, expect } from "./test-utils.js";
import { ALL_PROJECTS, UNASSIGNED_LABEL } from "../src/matrix.js";
import {
  TOOLBAR_SORTS,
  buildProjectFilterOptions,
  compareProjectItems,
  sortProjectItems,
  projectSectionsFrom
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

describe("project sections", () => {
  const tasks = [
    { title: "Audit", project: "Alpha", importance: 3, urgency: 1 },
    { title: "Prototype", project: "Beta", importance: 4, urgency: 2 },
    { title: "Spec", project: "Alpha", importance: 5, urgency: 4 },
    { title: "Backlog" }
  ];
  const projectList = ["Alpha", "Beta"];

  it("returns all sections when filters include all projects", () => {
    const sections = projectSectionsFrom(tasks, projectList, TOOLBAR_SORTS.MOST_RECENT, [ALL_PROJECTS]);
    expect(sections.length).toBe(3);
    expect(sections.map((section) => section.name)).toEqual(["Alpha", "Beta", UNASSIGNED_LABEL]);
    expect(sections[0].openItems.length).toBe(2);
    expect(sections[0].closedItems.length).toBe(0);
  });

  it("includes only matching projects when filters are scoped", () => {
    const sections = projectSectionsFrom(tasks, projectList, TOOLBAR_SORTS.MOST_RECENT, ["Beta"]);
    expect(sections.length).toBe(1);
    expect(sections[0].name).toBe("Beta");
  });

  it("includes unassigned section when requested", () => {
    const sections = projectSectionsFrom(tasks, projectList, TOOLBAR_SORTS.MOST_RECENT, [UNASSIGNED_LABEL]);
    expect(sections.length).toBe(1);
    expect(sections[0].name).toBe(UNASSIGNED_LABEL);
    expect(sections[0].openItems.map((entry) => entry.index)).toEqual([3]);
  });

  it("omits unassigned section when there are no unassigned tasks", () => {
    const assignedOnly = tasks.slice(0, 3);
    const sections = projectSectionsFrom(assignedOnly, projectList, TOOLBAR_SORTS.MOST_RECENT, [ALL_PROJECTS]);
    expect(sections.map((section) => section.name)).toEqual(["Alpha", "Beta"]);
  });

  it("returns no sections when filtering for unassigned without matches", () => {
    const assignedOnly = tasks.slice(0, 3);
    const sections = projectSectionsFrom(assignedOnly, projectList, TOOLBAR_SORTS.MOST_RECENT, [UNASSIGNED_LABEL]);
    expect(sections.length).toBe(0);
  });

  it("separates closed tasks into dedicated buckets", () => {
    const closedTask = { title: "Done", project: "Alpha", done: true };
    const sections = projectSectionsFrom(
      [...tasks, closedTask],
      projectList,
      TOOLBAR_SORTS.MOST_RECENT,
      [ALL_PROJECTS]
    );
    const alpha = sections.find((section) => section.name === "Alpha");
    expect(alpha.openItems.some((entry) => entry.task.title === "Done")).toBe(false);
    const closedTitles = alpha.closedItems.map((entry) => entry.task.title);
    expect(closedTitles.includes("Done")).toBe(true);
    expect(alpha.allItems.length).toBe(3);
  });
});

describe("toolbar project sorting", () => {
  const sample = [
    {
      index: 0,
      task: {
        title: "Write docs",
        importance: 3,
        urgency: 2,
        effort: 1,
        created: "2024-01-15T10:00:00Z"
      }
    },
    {
      index: 1,
      task: {
        title: "Review PR",
        importance: 4,
        urgency: 4,
        effort: 1,
        created: "2024-02-01T09:00:00Z"
      }
    },
    {
      index: 2,
      task: {
        title: "Plan sprint",
        importance: 4,
        urgency: 1,
        effort: 3,
        created: "2023-12-01T12:00:00Z"
      }
    },
    {
      index: 3,
      task: {
        title: "Archive",
        done: true,
        importance: 5,
        urgency: 5,
        effort: 1,
        created: "2022-01-01T08:00:00Z"
      }
    }
  ];

  it("keeps incomplete tasks before completed ones", () => {
    const sorted = sortProjectItems(sample, TOOLBAR_SORTS.MOST_RECENT);
    expect(sorted.at(-1).task.done).toBe(true);
  });

  it("sorts by lowest effort when requested", () => {
    const sorted = sortProjectItems(sample, TOOLBAR_SORTS.LOWEST_EFFORT);
    expect(sorted.map((entry) => entry.task.title)).toEqual([
      "Review PR",
      "Write docs",
      "Plan sprint",
      "Archive"
    ]);
  });

  it("sorts by oldest created date when requested", () => {
    const sorted = sortProjectItems(sample, TOOLBAR_SORTS.OLDEST);
    expect(sorted.map((entry) => entry.task.title)).toEqual([
      "Plan sprint",
      "Write docs",
      "Review PR",
      "Archive"
    ]);
  });

  it("sorts by most recent created date by default", () => {
    const sorted = sortProjectItems(sample, TOOLBAR_SORTS.MOST_RECENT);
    expect(sorted.map((entry) => entry.task.title)).toEqual([
      "Review PR",
      "Write docs",
      "Plan sprint",
      "Archive"
    ]);
  });

  it("falls back to score ordering when metadata matches", () => {
    const first = { index: 0, task: { effort: 2, importance: 4, urgency: 4 } };
    const second = { index: 1, task: { effort: 2, importance: 3, urgency: 3 } };
    const comparison = compareProjectItems(first, second, TOOLBAR_SORTS.LOWEST_EFFORT);
    expect(comparison < 0).toBe(true);
  });
});
