import { describe, it, expect } from "./test-utils.js";
import { prepareTaskTitleRename } from "../src/taskRename.js";

describe("prepareTaskTitleRename", () => {
  it("requires a non-empty title", () => {
    const result = prepareTaskTitleRename({ title: "Task" }, "   ");
    expect(result.ok).toBe(false);
    expect(result.message).toBe("Task title is required");
  });

  it("rejects when the task is missing", () => {
    const result = prepareTaskTitleRename(undefined, "Hello");
    expect(result.ok).toBe(false);
    expect(result.message).toBe("Task not found");
  });

  it("marks unchanged titles as no-op", () => {
    const result = prepareTaskTitleRename({ title: "Task" }, "Task");
    expect(result.ok).toBe(true);
    expect(result.changed).toBe(false);
    expect(result.title).toBe("Task");
  });

  it("trims and reports a changed title", () => {
    const result = prepareTaskTitleRename({ title: "Task" }, "  Focus  ");
    expect(result.ok).toBe(true);
    expect(result.changed).toBe(true);
    expect(result.title).toBe("Focus");
  });
});
