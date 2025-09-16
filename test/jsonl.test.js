import { describe, it, expect } from "vitest";
import { parseJSONL, toJSONL } from "../src/jsonl.js";

describe("parseJSONL", () => {
  it("returns an empty array for empty input", () => {
    expect(parseJSONL("")).toEqual([]);
  });

  it("parses JSON objects per non-empty line", () => {
    const text = '{"id":1}\n\n {"name":"Task"}\r\n{"done":false}';
    expect(parseJSONL(text)).toEqual([
      { id: 1 },
      { name: "Task" },
      { done: false }
    ]);
  });

  it("skips comment lines prefixed with #", () => {
    const text = '# heading\n{"id":1}\n# trailing note';
    expect(parseJSONL(text)).toEqual([{ id: 1 }]);
  });

  it("throws with line information for malformed JSON", () => {
    expect(() => parseJSONL('{"ok":true}\n{"bad": ')).toThrowError(/line 2/i);
  });
});

describe("toJSONL", () => {
  it("returns an empty string for empty collections", () => {
    expect(toJSONL([])).toBe("");
    expect(toJSONL()).toBe("");
  });

  it("stringifies each record on its own line", () => {
    const records = [{ id: 1 }, { name: "Task" }];
    expect(toJSONL(records)).toBe('{"id":1}\n{"name":"Task"}');
  });

  it("round-trips simple payloads", () => {
    const records = [{ title: "a" }, { title: "b" }];
    const text = toJSONL(records);
    expect(parseJSONL(text)).toEqual(records);
  });
});
