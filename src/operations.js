import { addProject, collectProjects, renameProject } from "./projects.js";
import { createTaskPayload } from "./taskFactory.js";

function ensureObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function cloneTask(task) {
  const copy = { ...task };
  if (Array.isArray(task?.tags)) {
    copy.tags = [...task.tags];
  }
  return copy;
}

function normalizeTimestampFactory(nowOption) {
  if (typeof nowOption === "function") {
    return () => {
      const value = nowOption();
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === "string" || typeof value === "number") {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      return new Date().toISOString();
    };
  }
  if (nowOption instanceof Date) {
    const iso = nowOption.toISOString();
    return () => iso;
  }
  if (typeof nowOption === "string" || typeof nowOption === "number") {
    const date = new Date(nowOption);
    if (!Number.isNaN(date.getTime())) {
      const iso = date.toISOString();
      return () => iso;
    }
  }
  return () => new Date().toISOString();
}

function formatError(index, type, message) {
  const label = type ? ` (${type})` : "";
  return { ok: false, error: `Operation ${index + 1}${label}: ${message}` };
}

function normalizeOperation(rawOperation, index) {
  if (!ensureObject(rawOperation)) {
    return formatError(index, "", "Each operation must be an object with a single key.");
  }
  const entries = Object.entries(rawOperation);
  if (entries.length !== 1) {
    return formatError(index, "", "Each operation must contain exactly one operation key.");
  }
  const [type, config] = entries[0];
  if (!ensureObject(config)) {
    return formatError(index, type, "Operation configuration must be an object.");
  }
  if (!ensureObject(config.data)) {
    return formatError(index, type, "Operation must include a data object.");
  }
  return { ok: true, type, data: config.data };
}

function validatePriorityField(name, value, min, max) {
  if (value == null) {
    if (value === null) {
      return { ok: true, remove: true };
    }
    return { ok: true, value: undefined };
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { ok: false, error: `${name} must be a number between ${min} and ${max}.` };
  }
  const intValue = Math.round(value);
  if (intValue < min || intValue > max) {
    return { ok: false, error: `${name} must be between ${min} and ${max}.` };
  }
  return { ok: true, value: intValue };
}

function validateDue(value) {
  if (value == null) {
    if (value === null) {
      return { ok: true, remove: true };
    }
    return { ok: true, value: undefined };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "due must be a YYYY-MM-DD string." };
  }
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { ok: false, error: "due must be formatted as YYYY-MM-DD." };
  }
  return { ok: true, value: trimmed };
}

function validateNotes(value) {
  if (value == null) {
    if (value === null) {
      return { ok: true, remove: true };
    }
    return { ok: true, value: undefined };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "notes must be a string." };
  }
  return { ok: true, value };
}

function validateProject(value, allowRemoval = false) {
  if (value == null) {
    if (value === null && allowRemoval) {
      return { ok: true, remove: true };
    }
    if (value === null) {
      return { ok: false, error: "project cannot be null." };
    }
    return { ok: true, value: undefined };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "project must be a string." };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: "project must not be empty." };
  }
  return { ok: true, value: trimmed };
}

function validateTaskId(id) {
  if (typeof id !== "string" || !id.trim()) {
    return { ok: false, error: "id is required and must be a string." };
  }
  return { ok: true, value: id };
}

function normalizeCompletedAt(value, fallbackIso) {
  if (value == null) {
    return { ok: true, value: fallbackIso };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "completed_at must be an ISO timestamp string." };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, error: "completed_at must be a valid ISO timestamp." };
  }
  return { ok: true, value: parsed.toISOString() };
}

export function applyOperations(payload = {}, baseTasks = [], baseProjects = [], nowOption) {
  if (!Array.isArray(payload.operations)) {
    return { ok: false, error: "Operations payload must include an operations array." };
  }
  const timestampFactory = normalizeTimestampFactory(nowOption);
  const tasks = baseTasks.map(cloneTask);
  let projectRecords = baseProjects.slice();

  const normalized = payload.operations.map((operation, index) =>
    normalizeOperation(operation, index)
  );
  const invalid = normalized.find((result) => !result.ok);
  if (invalid) {
    return invalid;
  }

  for (let index = 0; index < normalized.length; index += 1) {
    const entry = normalized[index];
    if (!entry.ok) {
      return entry;
    }
    const { type, data } = entry;
    const timestampIso = timestampFactory();

    if (type === "add_project") {
      const nameResult = validateProject(data?.name);
      if (!nameResult.ok) {
        return formatError(index, type, nameResult.error);
      }
      const outcome = addProject(
        projectRecords,
        nameResult.value
      );
      if (!outcome.ok) {
        return formatError(index, type, outcome.message);
      }
      projectRecords = outcome.projects;
      continue;
    }

    if (type === "rename_project") {
      const fromResult = validateProject(data?.from);
      if (!fromResult.ok) {
        return formatError(index, type, fromResult.error ?? "from project name is required.");
      }
      const toResult = validateProject(data?.to);
      if (!toResult.ok) {
        return formatError(index, type, toResult.error);
      }
      const outcome = renameProject(
        projectRecords,
        tasks,
        fromResult.value,
        toResult.value,
        timestampIso
      );
      if (!outcome.ok) {
        return formatError(index, type, outcome.message);
      }
      projectRecords = outcome.projects;
      outcome.tasks.forEach((task, taskIndex) => {
        tasks[taskIndex] = task;
      });
      continue;
    }

    if (type === "add_task") {
      if (!ensureObject(data)) {
        return formatError(index, type, "data must be an object.");
      }
      const title = typeof data.title === "string" ? data.title.trim() : "";
      if (!title) {
        return formatError(index, type, "title is required.");
      }
      const projectResult = validateProject(data.project, true);
      if (!projectResult.ok) {
        return formatError(index, type, projectResult.error);
      }
      const importanceResult = validatePriorityField("importance", data.importance ?? 1, 1, 5);
      if (!importanceResult.ok) {
        return formatError(index, type, importanceResult.error);
      }
      const urgencyResult = validatePriorityField("urgency", data.urgency ?? 1, 1, 5);
      if (!urgencyResult.ok) {
        return formatError(index, type, urgencyResult.error);
      }
      const effortResult = validatePriorityField("effort", data.effort ?? 3, 1, 10);
      if (!effortResult.ok) {
        return formatError(index, type, effortResult.error);
      }
      const dueResult = validateDue(data.due);
      if (!dueResult.ok) {
        return formatError(index, type, dueResult.error);
      }
      const notesResult = validateNotes(data.notes);
      if (!notesResult.ok) {
        return formatError(index, type, notesResult.error);
      }
      const draft = {
        title,
        done: false,
        importance: importanceResult.value ?? 1,
        urgency: urgencyResult.value ?? 1,
        effort: effortResult.value ?? 3
      };
      if (projectResult.value) {
        draft.project = projectResult.value;
      }
      if (dueResult.value) {
        draft.due = dueResult.value;
      }
      if (notesResult.value) {
        draft.notes = notesResult.value;
      }
      const creationDate = new Date(timestampIso);
      const created = createTaskPayload(draft, creationDate);
      if (!created.ok) {
        return formatError(index, type, created.error ?? "Unable to create task.");
      }
      tasks.push(created.task);
      continue;
    }

    if (type === "update_task_fields") {
      if (!ensureObject(data)) {
        return formatError(index, type, "data must be an object.");
      }
      const idResult = validateTaskId(data.id);
      if (!idResult.ok) {
        return formatError(index, type, idResult.error);
      }
      if (!ensureObject(data.set)) {
        return formatError(index, type, "set must be an object.");
      }
      const taskIndex = tasks.findIndex((task) => task.id === idResult.value);
      if (taskIndex === -1) {
        return formatError(index, type, `Task with id ${idResult.value} was not found.`);
      }
      const original = tasks[taskIndex];
      const updatedTask = cloneTask(original);
      let changed = false;

      if (Object.prototype.hasOwnProperty.call(data.set, "title")) {
        const titleValue = typeof data.set.title === "string" ? data.set.title.trim() : "";
        if (!titleValue) {
          return formatError(index, type, "title must be a non-empty string.");
        }
        if (titleValue !== updatedTask.title) {
          updatedTask.title = titleValue;
          changed = true;
        }
      }

      if (Object.prototype.hasOwnProperty.call(data.set, "project")) {
        const projectResult = validateProject(data.set.project, true);
        if (!projectResult.ok) {
          return formatError(index, type, projectResult.error);
        }
        if (projectResult.remove) {
          if (updatedTask.project !== undefined) {
            delete updatedTask.project;
            changed = true;
          }
        } else if (projectResult.value !== updatedTask.project) {
          updatedTask.project = projectResult.value;
          changed = true;
        }
      }

      if (Object.prototype.hasOwnProperty.call(data.set, "importance")) {
        const importanceResult = validatePriorityField("importance", data.set.importance, 1, 5);
        if (!importanceResult.ok) {
          return formatError(index, type, importanceResult.error);
        }
        if (importanceResult.remove) {
          if (Object.prototype.hasOwnProperty.call(updatedTask, "importance")) {
            delete updatedTask.importance;
            changed = true;
          }
        } else if (importanceResult.value !== undefined && importanceResult.value !== updatedTask.importance) {
          updatedTask.importance = importanceResult.value;
          changed = true;
        }
      }

      if (Object.prototype.hasOwnProperty.call(data.set, "urgency")) {
        const urgencyResult = validatePriorityField("urgency", data.set.urgency, 1, 5);
        if (!urgencyResult.ok) {
          return formatError(index, type, urgencyResult.error);
        }
        if (urgencyResult.remove) {
          if (Object.prototype.hasOwnProperty.call(updatedTask, "urgency")) {
            delete updatedTask.urgency;
            changed = true;
          }
        } else if (urgencyResult.value !== undefined && urgencyResult.value !== updatedTask.urgency) {
          updatedTask.urgency = urgencyResult.value;
          changed = true;
        }
      }

      if (Object.prototype.hasOwnProperty.call(data.set, "effort")) {
        const effortResult = validatePriorityField("effort", data.set.effort, 1, 10);
        if (!effortResult.ok) {
          return formatError(index, type, effortResult.error);
        }
        if (effortResult.remove) {
          if (Object.prototype.hasOwnProperty.call(updatedTask, "effort")) {
            delete updatedTask.effort;
            changed = true;
          }
        } else if (effortResult.value !== undefined && effortResult.value !== updatedTask.effort) {
          updatedTask.effort = effortResult.value;
          changed = true;
        }
      }

      if (Object.prototype.hasOwnProperty.call(data.set, "due")) {
        const dueResult = validateDue(data.set.due);
        if (!dueResult.ok) {
          return formatError(index, type, dueResult.error);
        }
        if (dueResult.remove) {
          if (Object.prototype.hasOwnProperty.call(updatedTask, "due")) {
            delete updatedTask.due;
            changed = true;
          }
        } else if (dueResult.value !== updatedTask.due) {
          updatedTask.due = dueResult.value;
          changed = true;
        }
      }

      if (Object.prototype.hasOwnProperty.call(data.set, "notes")) {
        const notesResult = validateNotes(data.set.notes);
        if (!notesResult.ok) {
          return formatError(index, type, notesResult.error);
        }
        if (notesResult.remove) {
          if (Object.prototype.hasOwnProperty.call(updatedTask, "notes")) {
            delete updatedTask.notes;
            changed = true;
          }
        } else if (notesResult.value !== updatedTask.notes) {
          updatedTask.notes = notesResult.value;
          changed = true;
        }
      }

      if (changed) {
        updatedTask.updated = timestampIso;
      }
      tasks[taskIndex] = changed ? updatedTask : original;
      continue;
    }

    if (type === "mark_complete") {
      if (!ensureObject(data)) {
        return formatError(index, type, "data must be an object.");
      }
      const idResult = validateTaskId(data.id);
      if (!idResult.ok) {
        return formatError(index, type, idResult.error);
      }
      const taskIndex = tasks.findIndex((task) => task.id === idResult.value);
      if (taskIndex === -1) {
        return formatError(index, type, `Task with id ${idResult.value} was not found.`);
      }
      const completion = normalizeCompletedAt(data.completed_at, timestampIso);
      if (!completion.ok) {
        return formatError(index, type, completion.error);
      }
      const updatedTask = cloneTask(tasks[taskIndex]);
      updatedTask.done = true;
      updatedTask.updated = completion.value;
      tasks[taskIndex] = updatedTask;
      continue;
    }

    return formatError(index, type, "is not a supported operation.");
  }

  const finalProjects = collectProjects(
    tasks,
    projectRecords.map((name) => ({ type: "project", name }))
  );

  return { ok: true, tasks, projects: finalProjects };
}
