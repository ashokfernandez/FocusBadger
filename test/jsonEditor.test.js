import { describe, it, expect } from "./test-utils.js";
import { buildJSONExport, parseJSONInput } from "../src/jsonEditor.js";

describe("buildJSONExport", () => {
  it("serializes projects ahead of tasks", () => {
    const output = buildJSONExport(
      [{ title: "Task" }],
      ["Alpha"]
    );
    const parsed = JSON.parse(output.data);
    expect(parsed[0]).toEqual({ type: "project", name: "Alpha" });
    expect(parsed[1]).toEqual({ title: "Task" });
    expect(output.clipboardText.includes("# FocusBadger Assistant Briefing")).toBe(true);
    expect(output.clipboardData.includes("\"Task\"")).toBe(true);
  });

  it("omits completed tasks from clipboard data", () => {
    const output = buildJSONExport(
      [
        { title: "Open", done: false },
        { title: "Closed", done: true }
      ],
      []
    );
    expect(JSON.parse(output.data).length).toBe(2);
    const clipboardRecords = JSON.parse(output.clipboardData);
    expect(clipboardRecords.length).toBe(1);
    expect(clipboardRecords[0]).toEqual({ title: "Open", done: false });
    expect(output.clipboardText.includes("Closed")).toBe(false);
  });
});

describe("parseJSONInput", () => {
  it("parses JSON arrays", () => {
    const input = JSON.stringify(
      [
        { type: "project", name: "Alpha" },
        { title: "Task", project: "Alpha" }
      ],
      null,
      2
    );
    const result = parseJSONInput(input);
    expect(result.ok).toBe(true);
    expect(result.projects).toEqual(["Alpha"]);
    expect(result.tasks.length).toBe(1);
  });

  it("parses JSONL text", () => {
    const input = '{"type":"project","name":"Alpha"}\n{"title":"Task"}\n';
    const result = parseJSONInput(input);
    expect(result.ok).toBe(true);
    expect(result.projects).toEqual(["Alpha"]);
  });

  it("rejects when tasks are missing titles", () => {
    const input = JSON.stringify([{ title: "   " }]);
    const result = parseJSONInput(input);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Each task needs a non-empty title.");
  });

  it("applies operation payloads against the current state", () => {
    const baseTasks = [
      {
        id: "abc",
        title: "Existing",
        project: "Personal",
        importance: 3,
        urgency: 2,
        effort: 4,
        done: false,
        created: "2024-01-01T00:00:00.000Z",
        updated: "2024-01-01T00:00:00.000Z"
      }
    ];
    const baseProjects = ["Personal"];
    const payload = {
      operations: [
        { add_project: { data: { name: "Marketing" } } },
        {
          update_task_fields: {
            data: { id: "abc", set: { notes: "Follow up", importance: 4 } }
          }
        },
        {
          mark_complete: {
            data: { id: "abc", completed_at: "2024-02-01T00:00:00.000Z" }
          }
        },
        {
          add_task: {
            data: {
              title: "Warm beef for tacos",
              project: "Personal",
              importance: 4,
              urgency: 4,
              effort: 3
            }
          }
        }
      ]
    };

    const result = parseJSONInput(JSON.stringify(payload), {
      baseTasks,
      baseProjects,
      now: new Date("2024-02-01T12:00:00Z")
    });

    expect(result.ok).toBe(true);
    expect(result.origin).toBe("operations");
    expect(result.projects).toEqual(["Marketing", "Personal"]);
    expect(result.tasks.length).toBe(2);
    const [updatedTask, newTask] = result.tasks;
    expect(updatedTask.notes).toBe("Follow up");
    expect(updatedTask.importance).toBe(4);
    expect(updatedTask.done).toBe(true);
    expect(updatedTask.updated).toBe("2024-02-01T00:00:00.000Z");
    expect(newTask.title).toBe("Warm beef for tacos");
    expect(newTask.project).toBe("Personal");
    expect(newTask.created).toBe("2024-02-01T12:00:00.000Z");
    expect(newTask.updated).toBe("2024-02-01T12:00:00.000Z");
  });

  it("describes invalid operations clearly", () => {
    const payload = {
      operations: [
        {
          add_task: {
            data: {
              title: "  "
            }
          }
        }
      ]
    };
    const result = parseJSONInput(JSON.stringify(payload));
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Operation 1 (add_task): title is required.");
  });

  it("returns error for malformed JSON", () => {
    const result = parseJSONInput("{ invalid");
    expect(result.ok).toBe(false);
    expect(Boolean(result.error)).toBe(true);
  });

  it("requires objects", () => {
    const result = parseJSONInput(JSON.stringify([1, 2, 3]));
    expect(result.ok).toBe(false);
  });
});
