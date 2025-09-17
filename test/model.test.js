import { describe, it, expect } from "./test-utils.js";
import { score, bucket } from "../src/model.js";

describe("score", () => {
  it("defaults when fields are missing", () => {
    expect(score({ title: "t" })).toBe(-1); // 0+0-1
  });
  it("weights importance double", () => {
    expect(score({ title:"t", importance:3, urgency:2, effort:1 })).toBe(2*3+2-1);
  });
});

describe("bucket", () => {
  const now = new Date("2025-09-17T10:00:00Z");
  it("done goes to Done", () => {
    expect(bucket({ title:"t", done:true }, now)).toBe("Done");
  });
  it("no date goes to No date", () => {
    expect(bucket({ title:"t" }, now)).toBe("No date");
  });
  it("today", () => {
    expect(bucket({ title:"t", due:"2025-09-17" }, now)).toBe("Today");
  });
  it("this week", () => {
    expect(bucket({ title:"t", due:"2025-09-20" }, now)).toBe("This week");
  });
  it("later", () => {
    expect(bucket({ title:"t", due:"2025-10-01" }, now)).toBe("Later");
  });
});
