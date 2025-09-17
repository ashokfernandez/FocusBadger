import { describe, it, expect } from "./test-utils.js";
import { createTaskPayload } from "../src/taskFactory.js";

describe("createTaskPayload", () => {
  it("requires a title", () => {
    const result = createTaskPayload({ title: "  " });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Title is required");
  });

  it("fills in defaults with generated id and timestamps", () => {
    const now = new Date("2024-10-21T12:00:00Z");
    const result = createTaskPayload({ title: "Inbox" }, now);
    expect(result.ok).toBe(true);
    const task = result.task;
    expect(task.title).toBe("Inbox");
    expect(Boolean(task.id)).toBe(true);
    expect(task.created).toBe(now.toISOString());
    expect(task.updated).toBe(now.toISOString());
    expect(task.done).toBe(false);
  });

  it("keeps numeric fields when finite", () => {
    const result = createTaskPayload({
      title: "Spec",
      importance: 4,
      urgency: 2,
      effort: 3
    });
    expect(result.ok).toBe(true);
    expect(result.task.importance).toBe(4);
    expect(result.task.urgency).toBe(2);
    expect(result.task.effort).toBe(3);
  });

  it("includes tags and notes", () => {
    const result = createTaskPayload({
      title: "Write blog",
      tags: ["content", "launch", ""],
      notes: "Outline with design"
    });
    expect(result.ok).toBe(true);
    expect(result.task.tags).toEqual(["content", "launch"]);
    expect(result.task.notes).toBe("Outline with design");
  });
});
