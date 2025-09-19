import { MATRIX_SORTS } from "../matrix.js";
import { TOOLBAR_SORTS } from "../toolbar.js";
import { colors } from "../theme/tokens.js";

export const MATRIX_FILTER_CHIP_SPACING = { base: 2, md: 3 };

export const MATRIX_SORT_OPTION_CONFIG = [
  { value: MATRIX_SORTS.SCORE, label: "Top priority" },
  { value: MATRIX_SORTS.LOW_EFFORT, label: "Low effort first" }
];

export const GLOBAL_TOOLBAR_SORT_OPTIONS = [
  { value: TOOLBAR_SORTS.LOWEST_EFFORT, label: "Lowest Effort" },
  { value: TOOLBAR_SORTS.OLDEST, label: "Oldest" },
  { value: TOOLBAR_SORTS.MOST_RECENT, label: "Most Recent" }
];

export const GLOBAL_TOOLBAR_STACK_SPACING = { base: 3, md: 4 };

export const WORKSPACE_HEADER_ACTION_SPACING = { base: 2, md: 3 };

export const WORKSPACE_HEADER_MENU_STYLES = {
  gradient: "linear(to-r, purple.500, pink.500)",
  hover: "linear(to-r, purple.600, pink.600)",
  active: "linear(to-r, purple.700, pink.700)"
};

export const PRIORITY_MATRIX_STACK_SPACING = { base: 3, md: 4 };

export const PROJECT_PANEL_STACK_SPACING = { base: 5, md: 6 };

export const ASSISTANT_WORKFLOW_MODAL_SIZE = "4xl";

export const ASSISTANT_WORKFLOW_TAB_CONFIG = [
  { value: 0, label: "Copy for assistant" },
  { value: 1, label: "Apply assistant output" }
];

export const ASSISTANT_WORKFLOW_TEXT_COLOR = colors.assistantText;
