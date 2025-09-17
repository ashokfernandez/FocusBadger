function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `task-${Math.random().toString(36).slice(2, 10)}`;
}

export function createTaskPayload(draft, now = new Date()) {
  const title = draft?.title?.trim();
  if (!title) {
    return { ok: false, error: "Title is required" };
  }

  const createdAt = draft?.created ?? now.toISOString();
  const updatedAt = draft?.updated ?? createdAt;

  const task = {
    id: draft?.id ?? generateId(),
    title,
    done: Boolean(draft?.done ?? false),
    created: createdAt,
    updated: updatedAt
  };

  if (draft?.project) task.project = draft.project;
  if (draft?.due) task.due = draft.due;

  const numeric = {
    importance: draft?.importance,
    urgency: draft?.urgency,
    effort: draft?.effort
  };

  for (const [key, value] of Object.entries(numeric)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      task[key] = value;
    }
  }

  if (Array.isArray(draft?.tags)) {
    task.tags = draft.tags.filter(Boolean);
  }

  if (draft?.notes) {
    task.notes = draft.notes;
  }

  return { ok: true, task };
}
