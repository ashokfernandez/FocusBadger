import { score } from "./model.js";

export const ALL_PROJECTS = "__all__";
export const UNASSIGNED_LABEL = "Unassigned";

export const MATRIX_SORTS = {
  SCORE: "score",
  LOW_EFFORT: "low-effort"
};

export function normalizeProjectFilterKey(task) {
  const name = task?.project;
  if (typeof name !== "string") return UNASSIGNED_LABEL;
  const trimmed = name.trim();
  return trimmed.length ? trimmed : UNASSIGNED_LABEL;
}

export function shouldIncludeTaskInMatrix(task, filters = []) {
  if (!filters || filters.length === 0) return true;
  if (filters.includes(ALL_PROJECTS)) return true;
  const key = normalizeProjectFilterKey(task);
  return filters.includes(key);
}

function normalizeEffort(value) {
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

function compareByScore(a, b) {
  const diff = score(b.task) - score(a.task);
  if (diff !== 0) return diff;
  return (a.task.title ?? "").localeCompare(b.task.title ?? "");
}

export function compareMatrixEntries(a, b, sortMode = MATRIX_SORTS.SCORE) {
  if (sortMode === MATRIX_SORTS.LOW_EFFORT) {
    const effortDiff = normalizeEffort(a.task?.effort) - normalizeEffort(b.task?.effort);
    if (effortDiff !== 0) return effortDiff;
  }
  return compareByScore(a, b);
}

export function sortMatrixEntries(entries, sortMode = MATRIX_SORTS.SCORE) {
  return entries.slice().sort((a, b) => compareMatrixEntries(a, b, sortMode));
}
