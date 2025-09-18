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
