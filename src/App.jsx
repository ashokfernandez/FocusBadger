import { useCallback, useMemo, useRef, useState } from "react";
import { parseJSONL, toJSONL } from "./jsonl.js";
import { bucket, score } from "./model.js";

const BUCKETS = ["Today", "This week", "Later", "No date", "Done"];

function TaskCard({ item, onToggle }) {
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
      onClick={() => onToggle(index)}
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

function BucketColumn({ name, items, onToggleTask, onDropTask }) {
  const [isHover, setHover] = useState(false);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    if (!isHover) setHover(true);
  }, [isHover]);

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
          <TaskCard key={item.index} item={item} onToggle={onToggleTask} />
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
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
      const changed = mutator(draft);
      if (!changed) return prev;
      draft.updated = new Date().toISOString();
      const next = [...prev];
      next[index] = draft;
      return next;
    });
  }, []);

  const handleToggleTask = useCallback(
    (index) => {
      updateTask(index, (draft) => {
        draft.done = !draft.done;
        return true;
      });
    },
    [updateTask]
  );

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
            onToggleTask={handleToggleTask}
            onDropTask={handleDropTask}
          />
        ))}
      </div>
    </div>
  );
}
