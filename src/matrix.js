import { bucket, score } from "./model.js";

export const ALL_PROJECTS = "__all__";
export const UNASSIGNED_LABEL = "Unassigned";

export const MATRIX_SORTS = {
  SCORE: "score",
  LOW_EFFORT: "low-effort"
};

export const LOW_EFFORT_MOOD_THRESHOLD = 3;

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

export function classifyTaskPriority(task, now = new Date()) {
  const rawUrgency = task?.urgency;
  const rawImportance = task?.importance;
  const urgencyScore = rawUrgency ?? 0;
  const importanceScore = rawImportance ?? 0;
  const dueBucket = bucket(task, now);
  const isUrgent = urgencyScore >= 3 || (rawUrgency == null && dueBucket === "Today");
  const isImportant = importanceScore >= 3;

  return {
    isUrgent,
    isImportant,
    urgencyLabel: isUrgent ? "Urgent" : "Can wait",
    importanceLabel: isImportant ? "Important" : "Low priority"
  };
}

export function getTaskMoodHighlight(task, highlightMode, { priority, now } = {}) {
  if (!highlightMode) {
    return { isPriorityHighlight: false, isLowEffortHighlight: false };
  }

  const resolvedPriority = priority ?? classifyTaskPriority(task, now);
  const isDone = Boolean(task?.done);
  const effort = task?.effort;
  const hasEffort = Number.isFinite(effort);

  const isPriorityHighlight =
    highlightMode === MATRIX_SORTS.SCORE && resolvedPriority.isUrgent && resolvedPriority.isImportant && !isDone;
  const isLowEffortHighlight =
    highlightMode === MATRIX_SORTS.LOW_EFFORT && hasEffort && effort <= LOW_EFFORT_MOOD_THRESHOLD && !isDone;

  return { isPriorityHighlight, isLowEffortHighlight };
}

export function getProjectMoodHighlight(items = [], highlightMode, { now } = {}) {
  if (!highlightMode || !Array.isArray(items) || items.length === 0) {
    return { hasPriorityHighlight: false, hasLowEffortHighlight: false };
  }

  return items.reduce(
    (acc, item) => {
      const entry = item ?? {};
      const task = entry.task ?? entry;
      if (!task) return acc;
      const { isPriorityHighlight, isLowEffortHighlight } = getTaskMoodHighlight(task, highlightMode, {
        priority: entry.priority,
        now
      });
      return {
        hasPriorityHighlight: acc.hasPriorityHighlight || isPriorityHighlight,
        hasLowEffortHighlight: acc.hasLowEffortHighlight || isLowEffortHighlight
      };
    },
    { hasPriorityHighlight: false, hasLowEffortHighlight: false }
  );
}
