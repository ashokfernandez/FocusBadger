import { describe, expect, it } from "./test-utils.js";
import { HEADER_LAYOUT, MATRIX_GRID_COLUMNS } from "../src/layout.js";

describe("responsive layout", () => {
  it("stacks header actions vertically on mobile and horizontally on desktop", () => {
    expect(HEADER_LAYOUT.container.direction.base).toBe("column");
    expect(HEADER_LAYOUT.container.direction.md).toBe("row");
  });

  it("stretches header controls to fill the viewport on small screens", () => {
    expect(HEADER_LAYOUT.container.w).toBe("full");
    expect(HEADER_LAYOUT.button.w.base).toBe("full");
  });

  it("lets header controls shrink on larger screens", () => {
    expect(HEADER_LAYOUT.button.w.sm).toBe("auto");
  });

  it("uses responsive columns for the priority matrix", () => {
    expect(MATRIX_GRID_COLUMNS).toEqual({ base: 1, md: 2, xl: 4 });
  });
});
