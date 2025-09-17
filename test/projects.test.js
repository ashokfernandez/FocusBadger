import { describe, it, expect } from "./test-utils.js";
import {
  addProject,
  buildSnapshot,
  collectProjects,
  deleteProject,
  hydrateRecords,
  renameProject,
  sortProjects
} from "../src/projects.js";

describe("projects helpers", () => {
  it("sorts projects case-insensitively", () => {
    expect(sortProjects(["Work", "alpha", "Beta"])).toEqual(["alpha", "Beta", "Work"]);
  });

  it("collects projects from tasks and records", () => {
    const tasks = [
      { title: "t1", project: "Alpha" },
      { title: "t2", project: "beta" },
      { title: "t3" }
    ];
    const projectRecords = [{ type: "project", name: "Work" }];
    expect(collectProjects(tasks, projectRecords)).toEqual(["Alpha", "beta", "Work"]);
  });

  it("hydrates records into tasks and projects", () => {
    const { tasks, projects } = hydrateRecords([
      { type: "project", name: "Alpha" },
      { id: "1", title: "Task", project: "Alpha" }
    ]);
    expect(projects).toEqual(["Alpha"]);
    expect(tasks).toEqual([{ id: "1", title: "Task", project: "Alpha" }]);
  });

  it("builds snapshot prepending project records", () => {
    const snapshot = buildSnapshot(
      [{ id: "1", title: "Task", project: "Alpha" }],
      ["Alpha", "Beta"]
    );
    expect(snapshot.split("\n")).toEqual([
      '{"type":"project","name":"Alpha"}',
      '{"type":"project","name":"Beta"}',
      '{"id":"1","title":"Task","project":"Alpha"}'
    ]);
  });

  it("adds projects uniquely and trims names", () => {
    expect(addProject(["Work"], "  New ")).toEqual({
      ok: true,
      projects: ["New", "Work"],
      name: "New"
    });
    expect(addProject(["Work"], "work").ok).toBe(false);
  });

  it("renames projects and updates tasks", () => {
    const result = renameProject(
      ["Alpha", "Work"],
      [{ id: "1", title: "Task", project: "Alpha" }],
      "Alpha",
      " Focus ",
      "2025-01-01T00:00:00Z"
    );
    expect(result.ok).toBe(true);
    expect(result.projects).toEqual(["Focus", "Work"]);
    expect(result.tasks).toEqual([
      { id: "1", title: "Task", project: "Focus", updated: "2025-01-01T00:00:00Z" }
    ]);
  });

  it("prevents rename collisions", () => {
    const result = renameProject(["Alpha", "Work"], [], "Alpha", "work");
    expect(result.ok).toBe(false);
  });

  it("deletes projects and clears assignments", () => {
    const result = deleteProject(
      ["Alpha", "Work"],
      [
        { id: "1", title: "Task", project: "Alpha" },
        { id: "2", title: "Task", project: "Work" },
      ],
      "Alpha",
      "2025-01-01T00:00:00Z"
    );
    expect(result.projects).toEqual(["Work"]);
    expect(result.tasks).toEqual([
      { id: "1", title: "Task", project: undefined, updated: "2025-01-01T00:00:00Z" },
      { id: "2", title: "Task", project: "Work" }
    ]);
  });
});
