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

function resolveHighlightUrgency(task, now = new Date()) {
  const rawUrgency = task?.urgency;
  if (Number.isFinite(rawUrgency)) return rawUrgency;
  return classifyTaskPriority(task, now).isUrgent ? 1 : 0;
}

function resolveHighlightImportance(task) {
  const rawImportance = task?.importance;
  return Number.isFinite(rawImportance) ? rawImportance : 0;
}

function resolveHighlightEffort(task) {
  const rawEffort = task?.effort;
  return Number.isFinite(rawEffort) ? rawEffort : Number.POSITIVE_INFINITY;
}

function comparePriorityHighlightCandidates(a, b) {
  const urgencyDiff = b.urgency - a.urgency;
  if (urgencyDiff !== 0) return urgencyDiff;

  const importanceDiff = b.importance - a.importance;
  if (importanceDiff !== 0) return importanceDiff;

  const effortDiff = a.effort - b.effort;
  if (effortDiff !== 0) return effortDiff;

  const scoreDiff = score(b.task ?? {}) - score(a.task ?? {});
  if (scoreDiff !== 0) return scoreDiff;

  return a.index - b.index;
}

function compareLowEffortHighlightCandidates(a, b) {
  const effortDiff = a.effort - b.effort;
  if (effortDiff !== 0) return effortDiff;

  const urgencyDiff = b.urgency - a.urgency;
  if (urgencyDiff !== 0) return urgencyDiff;

  const importanceDiff = b.importance - a.importance;
  if (importanceDiff !== 0) return importanceDiff;

  const scoreDiff = score(b.task ?? {}) - score(a.task ?? {});
  if (scoreDiff !== 0) return scoreDiff;

  return a.index - b.index;
}

export function selectHighlightTaskIndexes(
  tasks = [],
  highlightMode,
  { filters = [], limit = 3, now = new Date() } = {}
) {
  if (!highlightMode || !Array.isArray(tasks) || limit <= 0) {
    return new Set();
  }

  const mode = highlightMode;
  const candidates = [];

  tasks.forEach((task, index) => {
    if (!task || task.done) return;
    if (!shouldIncludeTaskInMatrix(task, filters)) return;

    const effortValue = resolveHighlightEffort(task);
    const isLowEffortMode = mode === MATRIX_SORTS.LOW_EFFORT;
    if (isLowEffortMode) {
      if (!Number.isFinite(task?.effort)) return;
      if (effortValue > LOW_EFFORT_MOOD_THRESHOLD) return;
    }

    candidates.push({
      index,
      task,
      urgency: resolveHighlightUrgency(task, now),
      importance: resolveHighlightImportance(task),
      effort: effortValue
    });
  });

  if (candidates.length === 0) {
    return new Set();
  }

  const comparator =
    mode === MATRIX_SORTS.LOW_EFFORT
      ? compareLowEffortHighlightCandidates
      : comparePriorityHighlightCandidates;

  candidates.sort(comparator);

  const selected = candidates.slice(0, limit).map((entry) => entry.index);
  return new Set(selected);
}

export function getTaskMoodHighlight(task, highlightMode, {
  priority,
  now,
  highlightedTaskIndexes,
  taskIndex
} = {}) {
  if (!highlightMode) {
    return { isPriorityHighlight: false, isLowEffortHighlight: false };
  }

  const resolvedPriority = priority ?? classifyTaskPriority(task, now);
  const isDone = Boolean(task?.done);
  const effort = task?.effort;
  const hasEffort = Number.isFinite(effort);
  const hasSelection = highlightedTaskIndexes instanceof Set;
  const isSelected = hasSelection && highlightedTaskIndexes.has(taskIndex ?? -1);

  const isPriorityHighlight = !isDone
    && (highlightMode === MATRIX_SORTS.SCORE)
    && (hasSelection ? isSelected : resolvedPriority.isUrgent && resolvedPriority.isImportant);

  const isLowEffortHighlight = !isDone
    && highlightMode === MATRIX_SORTS.LOW_EFFORT
    && (hasSelection ? isSelected : hasEffort && effort <= LOW_EFFORT_MOOD_THRESHOLD);

  return { isPriorityHighlight, isLowEffortHighlight };
}

export function getProjectMoodHighlight(items = [], highlightMode, {
  now,
  highlightedTaskIndexes
} = {}) {
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
        now,
        highlightedTaskIndexes,
        taskIndex: entry.index
      });
      return {
        hasPriorityHighlight: acc.hasPriorityHighlight || isPriorityHighlight,
        hasLowEffortHighlight: acc.hasLowEffortHighlight || isLowEffortHighlight
      };
    },
    { hasPriorityHighlight: false, hasLowEffortHighlight: false }
  );
}
