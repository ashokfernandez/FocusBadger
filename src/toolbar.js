import { score } from "./model.js";
import { ALL_PROJECTS, UNASSIGNED_LABEL } from "./matrix.js";

export const TOOLBAR_SORTS = {
  SCORE: "score",
  DUE_DATE: "due-date",
  TITLE: "title"
};

export function buildProjectFilterOptions(projects = []) {
  const seen = new Set();
  const options = [ALL_PROJECTS];
  projects.forEach((project) => {
    if (project && !seen.has(project)) {
      options.push(project);
      seen.add(project);
    }
  });
  if (!seen.has(UNASSIGNED_LABEL)) {
    options.push(UNASSIGNED_LABEL);
  }
  return options;
}

function normalizeDueValue(task) {
  const due = task?.due;
  if (!due) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(due);
  if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
  return parsed;
}

function compareTitle(a = "", b = "") {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function compareProjectItems(a, b, sortMode = TOOLBAR_SORTS.SCORE) {
  const sort = sortMode ?? TOOLBAR_SORTS.SCORE;
  if (a.task.done !== b.task.done) {
    return a.task.done ? 1 : -1;
  }

  const scoreA = score(a.task ?? {});
  const scoreB = score(b.task ?? {});
  const dueA = normalizeDueValue(a.task);
  const dueB = normalizeDueValue(b.task);
  const titleDiff = compareTitle(a.task?.title, b.task?.title);

  if (sort === TOOLBAR_SORTS.DUE_DATE) {
    const dueDiff = dueA - dueB;
    if (dueDiff !== 0) return dueDiff;
  } else if (sort === TOOLBAR_SORTS.TITLE) {
    if (titleDiff !== 0) return titleDiff;
  } else {
    const scoreDiff = scoreB - scoreA;
    if (scoreDiff !== 0) return scoreDiff;
  }

  const scoreDiff = scoreB - scoreA;
  if (scoreDiff !== 0) return scoreDiff;

  if (titleDiff !== 0) return titleDiff;

  return a.index - b.index;
}

export function sortProjectItems(items = [], sortMode = TOOLBAR_SORTS.SCORE) {
  return items.slice().sort((a, b) => compareProjectItems(a, b, sortMode));
}
