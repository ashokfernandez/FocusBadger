import { describe, it, expect } from "vitest";
import { parseJSONL, toJSONL } from "../src/jsonl.js";

describe("jsonl", () => {
  it("parses ignoring comments", () => {
    const txt = "# header\n{\"a\":1}\n\n{\"b\":2}\n";
    expect(parseJSONL(txt)).toEqual([{a:1},{b:2}]);
  });
  it("stringifies with newline", () => {
    const s = toJSONL([{a:1},{b:2}]);
    expect(s.endsWith("\n")).toBe(true);
    expect(s.split("\n").filter(Boolean).length).toBe(2);
  });
});
