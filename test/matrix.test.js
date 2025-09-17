import { describe, it, expect } from "vitest";
import {
  ALL_PROJECTS,
  UNASSIGNED_LABEL,
  normalizeProjectFilterKey,
  shouldIncludeTaskInMatrix
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
