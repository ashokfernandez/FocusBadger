export function prepareTaskTitleRename(task, nextTitle) {
  const trimmed = (nextTitle ?? "").trim();
  if (!trimmed) {
    return { ok: false, message: "Task title is required" };
  }
  if (!task) {
    return { ok: false, message: "Task not found" };
  }
  const unchanged = (task.title ?? "") === trimmed;
  return { ok: true, title: trimmed, changed: !unchanged };
}
