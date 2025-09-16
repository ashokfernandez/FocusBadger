import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseJSONL, toJSONL } from "./jsonl.js";
import { bucket, score } from "./model.js";

const BUCKETS = ["Today", "This week", "Later", "No date", "Done"];

function TaskCard({ item, onEdit }) {
  const { task, index } = item;

  const handleDragStart = useCallback(
    (event) => {
      if (!event.dataTransfer) return;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(index));
      event.currentTarget.classList.add("dragging");
    },
    [index]
  );

  const handleDragEnd = useCallback((event) => {
    event.currentTarget.classList.remove("dragging");
  }, []);

  const metaBits = [];
  if (task.project) metaBits.push(task.project);
  if (task.due) metaBits.push(`due ${task.due}`);
  metaBits.push(`score ${score(task)}`);

  return (
    <li
      className="card"
      draggable
      onClick={() => onEdit(index)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <span className="title">
        {task.done ? "✔︎" : "○"} {task.title}
      </span>
      <span className="meta">{metaBits.join(" • ")}</span>
    </li>
  );
}

function BucketColumn({ name, items, onEditTask, onDropTask }) {
  const [isHover, setHover] = useState(false);

  const handleDragOver = useCallback(
    (event) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
      if (!isHover) setHover(true);
    },
    [isHover]
  );

  const handleDragLeave = useCallback(() => {
    setHover(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setHover(false);
      if (!event.dataTransfer) return;
      onDropTask(name, event.dataTransfer.getData("text/plain"));
    },
    [name, onDropTask]
  );

  return (
    <div className={`col${isHover ? " drop-hover" : ""}`} data-bucket={name}>
      <h2>{name}</h2>
      <ul onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave}>
        {items.map((item) => (
          <TaskCard key={item.index} item={item} onEdit={onEditTask} />
        ))}
      </ul>
    </div>
  );
}

function sanitizeNumber(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseTags(value) {
  if (!value) return undefined;
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length ? tags : undefined;
}

function TaskEditor({ task, onCancel, onSave }) {
  const [form, setForm] = useState(() => ({
    title: task?.title ?? "",
    project: task?.project ?? "",
    due: task?.due ?? "",
    importance: task?.importance ?? "",
    urgency: task?.urgency ?? "",
    effort: task?.effort ?? "",
    tags: task?.tags ? task.tags.join(", ") : "",
    notes: task?.notes ?? "",
    done: Boolean(task?.done)
  }));
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      title: task?.title ?? "",
      project: task?.project ?? "",
      due: task?.due ?? "",
      importance: task?.importance ?? "",
      urgency: task?.urgency ?? "",
      effort: task?.effort ?? "",
      tags: task?.tags ? task.tags.join(", ") : "",
      notes: task?.notes ?? "",
      done: Boolean(task?.done)
    });
    setError("");
  }, [task]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      const title = form.title.trim();
      if (!title) {
        setError("Title is required");
        return;
      }
      const changes = {
        title,
        project: form.project.trim() || undefined,
        due: form.due.trim() || undefined,
        importance: sanitizeNumber(form.importance),
        urgency: sanitizeNumber(form.urgency),
        effort: sanitizeNumber(form.effort),
        tags: parseTags(form.tags),
        notes: form.notes.trim() || undefined,
        done: form.done
      };
      onSave(changes);
    },
    [form, onSave]
  );

  if (!task) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal" onSubmit={handleSubmit}>
        <header className="modal-header">
          <h3>Edit task</h3>
        </header>
        <div className="field">
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            value={form.title}
            onChange={(event) => handleChange("title", event.target.value)}
            required
          />
        </div>
        <div className="field-grid">
          <label>
            Project
            <input
              value={form.project}
              onChange={(event) => handleChange("project", event.target.value)}
            />
          </label>
          <label>
            Due date
            <input
              type="date"
              value={form.due}
              onChange={(event) => handleChange("due", event.target.value)}
            />
          </label>
        </div>
        <div className="field-grid numbers">
          <label>
            Importance
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={form.importance}
              onChange={(event) => handleChange("importance", event.target.value)}
            />
          </label>
          <label>
            Urgency
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={form.urgency}
              onChange={(event) => handleChange("urgency", event.target.value)}
            />
          </label>
          <label>
            Effort
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={form.effort}
              onChange={(event) => handleChange("effort", event.target.value)}
            />
          </label>
        </div>
        <div className="field">
          <label htmlFor="task-tags">Tags (comma separated)</label>
          <input
            id="task-tags"
            value={form.tags}
            onChange={(event) => handleChange("tags", event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="task-notes">Notes</label>
          <textarea
            id="task-notes"
            rows={4}
            value={form.notes}
            onChange={(event) => handleChange("notes", event.target.value)}
          />
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.done}
            onChange={(event) => handleChange("done", event.target.checked)}
          />
          <span>Mark as done</span>
        </label>
        {error ? <p className="error">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [editing, setEditing] = useState(null);
  const fileHandleRef = useRef(null);

  const buckets = useMemo(() => {
    const now = new Date();
    const withIndex = tasks.map((task, index) => ({ task, index }));
    return BUCKETS.map((name) => ({
      name,
      items: withIndex
        .filter(({ task }) => bucket(task, now) === name)
        .sort((a, b) => score(b.task) - score(a.task))
    }));
  }, [tasks]);

  const updateTask = useCallback((index, mutator) => {
    setTasks((prev) => {
      const current = prev[index];
      if (!current) return prev;
      const draft = { ...current };
      const outcome = mutator(draft);
      if (!outcome) return prev;
      const nextTask = outcome === true ? draft : { ...draft, ...outcome };
      if (outcome !== true && typeof outcome === "object") {
        for (const [key, value] of Object.entries(outcome)) {
          if (value === undefined) {
            delete nextTask[key];
          }
        }
      }
      nextTask.updated = new Date().toISOString();
      const next = [...prev];
      next[index] = nextTask;
      return next;
    });
  }, []);

  const handleDropTask = useCallback(
    (bucketName, rawIndex) => {
      const index = Number.parseInt(rawIndex, 10);
      if (Number.isNaN(index)) return;
      updateTask(index, (draft) => {
        if (bucketName === "Done" && !draft.done) {
          draft.done = true;
          return true;
        }
        if (bucketName !== "Done" && draft.done) {
          draft.done = false;
          return true;
        }
        return false;
      });
    },
    [updateTask]
  );

  const handleOpenEditor = useCallback((index) => {
    setEditing({ index });
  }, []);

  const handleSaveEdit = useCallback(
    (changes) => {
      if (!editing) return;
      updateTask(editing.index, () => ({ ...changes }));
      setEditing(null);
    },
    [editing, updateTask]
  );

  const handleCancelEdit = useCallback(() => {
    setEditing(null);
  }, []);

  const handleLoadSample = useCallback(async () => {
    const res = await fetch("/tasks.sample.jsonl");
    const text = await res.text();
    setTasks(parseJSONL(text));
    fileHandleRef.current = null;
  }, []);

  const handleOpenFile = useCallback(async () => {
    if (!window.showOpenFilePicker) {
      alert("Use a Chromium browser for File System Access support");
      return;
    }
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: "JSONL", accept: { "text/plain": [".jsonl"] } }]
    });
    fileHandleRef.current = handle;
    const file = await handle.getFile();
    const text = await file.text();
    setTasks(parseJSONL(text));
  }, []);

  const handleSaveFile = useCallback(async () => {
    if (!fileHandleRef.current) {
      alert("Open a tasks file first");
      return;
    }
    const writable = await fileHandleRef.current.createWritable();
    await writable.write(toJSONL(tasks));
    await writable.close();
    alert("Saved");
  }, [tasks]);

  const editingTask = editing ? tasks[editing.index] : null;

  return (
    <div>
      <div className="actions">
        <button type="button" onClick={handleLoadSample}>
          Load sample
        </button>
        <button type="button" onClick={handleOpenFile}>
          Open tasks.jsonl
        </button>
        <button type="button" onClick={handleSaveFile}>
          Save
        </button>
      </div>
      <div className="wrap">
        {buckets.map(({ name, items }) => (
          <BucketColumn
            key={name}
            name={name}
            items={items}
            onEditTask={handleOpenEditor}
            onDropTask={handleDropTask}
          />
        ))}
      </div>
      {editingTask ? (
        <TaskEditor task={editingTask} onCancel={handleCancelEdit} onSave={handleSaveEdit} />
      ) : null}
    </div>
  );
}
