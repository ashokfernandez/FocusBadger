import { describe, expect, it } from "./test-utils.js";
import { HEADER_LAYOUT, MATRIX_GRID_COLUMNS } from "../src/layout.js";
import {
  GLOBAL_TOOLBAR_SORT_OPTIONS,
  GLOBAL_TOOLBAR_STACK_SPACING,
  MATRIX_FILTER_CHIP_SPACING,
  MATRIX_SORT_OPTION_CONFIG,
  WORKSPACE_HEADER_ACTION_SPACING,
  WORKSPACE_HEADER_MENU_STYLES,
  PRIORITY_MATRIX_STACK_SPACING,
  PROJECT_PANEL_STACK_SPACING,
  ASSISTANT_WORKFLOW_MODAL_SIZE,
  ASSISTANT_WORKFLOW_TAB_CONFIG,
  ASSISTANT_WORKFLOW_TEXT_COLOR
} from "../src/components/componentTokens.js";

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

  it("spaces matrix filter chips for touch targets on mobile", () => {
    expect(MATRIX_FILTER_CHIP_SPACING.base).toBe(2);
    expect(MATRIX_FILTER_CHIP_SPACING.md).toBe(3);
  });

  it("surfaces both priority and effort sort modes", () => {
    const values = MATRIX_SORT_OPTION_CONFIG.map((option) => option.value);
    expect(values).toEqual(["score", "low-effort"]);
  });

  it("keeps toolbar spacing responsive", () => {
    expect(GLOBAL_TOOLBAR_STACK_SPACING.base).toBe(3);
    expect(GLOBAL_TOOLBAR_STACK_SPACING.md).toBe(4);
  });

  it("exposes toolbar sort options for readability", () => {
    const labels = GLOBAL_TOOLBAR_SORT_OPTIONS.map((option) => option.label);
    expect(labels).toEqual([
      "Score (highest first)",
      "Due date (earliest)",
      "Title (A–Z)"
    ]);
  });

  it("keeps workspace actions touch friendly", () => {
    expect(WORKSPACE_HEADER_ACTION_SPACING.base).toBe(2);
    expect(WORKSPACE_HEADER_ACTION_SPACING.md).toBe(3);
    expect(WORKSPACE_HEADER_MENU_STYLES.gradient.includes("purple.500")).toBe(true);
  });

  it("spaces the matrix summary copy for mobile", () => {
    expect(PRIORITY_MATRIX_STACK_SPACING.base).toBe(3);
    expect(PRIORITY_MATRIX_STACK_SPACING.md).toBe(4);
  });

  it("widens project sections as the viewport grows", () => {
    expect(PROJECT_PANEL_STACK_SPACING.base).toBe(5);
    expect(PROJECT_PANEL_STACK_SPACING.md).toBe(6);
  });

  it("surfaces assistant workflow tabs consistently", () => {
    const values = ASSISTANT_WORKFLOW_TAB_CONFIG.map((option) => option.value);
    expect(values).toEqual([0, 1]);
    const labels = ASSISTANT_WORKFLOW_TAB_CONFIG.map((option) => option.label);
    expect(labels).toEqual(["Copy for assistant", "Apply assistant output"]);
    expect(ASSISTANT_WORKFLOW_MODAL_SIZE).toBe("4xl");
    expect(ASSISTANT_WORKFLOW_TEXT_COLOR).toBe("gray.600");
  });
});
