export const ALL_PROJECTS = "__all__";
export const UNASSIGNED_LABEL = "Unassigned";

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
