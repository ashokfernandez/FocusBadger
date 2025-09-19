import { score } from "./model.js";
import { compareInsensitive } from "./projects.js";
import { ALL_PROJECTS, UNASSIGNED_LABEL } from "./matrix.js";
import { LIST_SORTS } from "./listSorts.js";

export const TOOLBAR_SORTS = LIST_SORTS;

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

function normalizeEffort(value) {
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

function getCreatedTimestamp(task) {
  const created = task?.created;
  if (!created) return Number.NaN;
  const parsed = Date.parse(created);
  if (Number.isNaN(parsed)) return Number.NaN;
  return parsed;
}

function compareCreatedAsc(a, b) {
  const createdA = getCreatedTimestamp(a.task);
  const createdB = getCreatedTimestamp(b.task);
  if (!Number.isNaN(createdA) && !Number.isNaN(createdB)) {
    const diff = createdA - createdB;
    if (diff !== 0) return diff;
  }
  if (!Number.isNaN(createdA)) return -1;
  if (!Number.isNaN(createdB)) return 1;
  return 0;
}

function compareCreatedDesc(a, b) {
  const createdA = getCreatedTimestamp(a.task);
  const createdB = getCreatedTimestamp(b.task);
  if (!Number.isNaN(createdA) && !Number.isNaN(createdB)) {
    const diff = createdB - createdA;
    if (diff !== 0) return diff;
  }
  if (!Number.isNaN(createdB)) return 1;
  if (!Number.isNaN(createdA)) return -1;
  return 0;
}

export function compareProjectItems(a, b, sortMode = TOOLBAR_SORTS.MOST_RECENT) {
  const sort = sortMode ?? TOOLBAR_SORTS.MOST_RECENT;
  if (a.task.done !== b.task.done) {
    return a.task.done ? 1 : -1;
  }

  const scoreA = score(a.task ?? {});
  const scoreB = score(b.task ?? {});
  if (sort === TOOLBAR_SORTS.LOWEST_EFFORT) {
    const effortDiff = normalizeEffort(a.task?.effort) - normalizeEffort(b.task?.effort);
    if (effortDiff !== 0) return effortDiff;
  } else if (sort === TOOLBAR_SORTS.OLDEST) {
    const createdDiff = compareCreatedAsc(a, b);
    if (createdDiff !== 0) return createdDiff;
  } else {
    const createdDiff = compareCreatedDesc(a, b);
    if (createdDiff !== 0) return createdDiff;
  }

  const scoreDiff = scoreB - scoreA;
  if (scoreDiff !== 0) return scoreDiff;

  return a.index - b.index;
}

export function sortProjectItems(items = [], sortMode = TOOLBAR_SORTS.MOST_RECENT) {
  return items.slice().sort((a, b) => compareProjectItems(a, b, sortMode));
}

function buildSectionPayload(name, projectKey, items = [], sortMode) {
  const sorted = sortProjectItems(items, sortMode);
  const openItems = [];
  const closedItems = [];

  sorted.forEach((entry) => {
    if (entry?.task?.done) {
      closedItems.push(entry);
    } else {
      openItems.push(entry);
    }
  });

  return {
    name,
    projectKey,
    openItems,
    closedItems,
    allItems: sorted
  };
}

export function projectSectionsFrom(
  tasks = [],
  projects = [],
  sortMode = TOOLBAR_SORTS.MOST_RECENT,
  filters = [ALL_PROJECTS]
) {
  const map = new Map();
  projects.forEach((name) => {
    if (name) map.set(name, []);
  });

  const unassigned = [];

  tasks.forEach((task, index) => {
    const entry = { task, index };
    const key = task?.project?.trim();
    if (key) {
      if (!map.has(key)) {
        map.set(key, [entry]);
      } else {
        map.get(key).push(entry);
      }
    } else {
      unassigned.push(entry);
    }
  });

  const active = filters ?? [];
  const allowAll = active.includes(ALL_PROJECTS) || active.length === 0;
  const allowUnassigned = allowAll || active.includes(UNASSIGNED_LABEL);

  const entries = Array.from(map.entries())
    .filter(([name]) => allowAll || active.includes(name))
    .map(([name, items]) => buildSectionPayload(name, name, items, sortMode))
    .sort((a, b) => compareInsensitive(a.name, b.name));

  if (allowUnassigned && unassigned.length > 0) {
    entries.push(
      buildSectionPayload(UNASSIGNED_LABEL, undefined, unassigned, sortMode)
    );
  }

  return entries;
}
