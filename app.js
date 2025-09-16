import { parseJSONL, toJSONL } from "./src/jsonl.js";
import { score, bucket } from "./src/model.js";

const BUCKETS = ["Today", "This week", "Later", "No date", "Done"];

let fileHandle = null;
let tasks = [];

/** Render simple lists into buckets. */
function render() {
  for (const b of BUCKETS) {
    const el = document.querySelector(`[data-bucket="${b}"]`);
    el.innerHTML = "";
    const list = tasks
      .filter((t) => bucket(t) === b)
      .sort((a, bTask) => score(bTask) - score(a));
    for (const t of list) {
      const li = document.createElement("li");
      li.className = "card";
      li.draggable = true;
      li.dataset.index = String(tasks.indexOf(t));
      li.textContent = `${t.done ? "[x]" : "[ ]"} ${t.title} ${t.project ? "(" + t.project + ")" : ""} ${
        t.due ? "due " + t.due : ""
      } score=${score(t)}`;
      li.onclick = () => {
        t.done = !t.done;
        t.updated = new Date().toISOString();
        render();
      };
      li.addEventListener("dragstart", handleDragStart);
      li.addEventListener("dragend", handleDragEnd);
      el.appendChild(li);
    }
  }
}

const dropZones = Array.from(document.querySelectorAll("[data-bucket]"));
dropZones.forEach((zone) => {
  zone.addEventListener("dragover", handleDragOver);
  zone.addEventListener("dragleave", handleDragLeave);
  zone.addEventListener("drop", handleDrop);
});

function handleDragStart(event) {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement) || !event.dataTransfer) return;
  target.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", target.dataset.index ?? "");
}

function handleDragEnd(event) {
  const target = event.currentTarget;
  if (target instanceof HTMLElement) target.classList.remove("dragging");
}

function handleDragOver(event) {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  const zone = event.currentTarget;
  if (zone instanceof HTMLElement) zone.classList.add("drop-hover");
}

function handleDragLeave(event) {
  const zone = event.currentTarget;
  if (zone instanceof HTMLElement) zone.classList.remove("drop-hover");
}

function handleDrop(event) {
  event.preventDefault();
  const zone = event.currentTarget;
  if (!(zone instanceof HTMLElement)) return;
  zone.classList.remove("drop-hover");
  const bucketName = zone.dataset.bucket;
  if (!bucketName || !event.dataTransfer) return;
  const rawIndex = event.dataTransfer.getData("text/plain");
  const taskIndex = Number.parseInt(rawIndex, 10);
  if (Number.isNaN(taskIndex)) return;
  const task = tasks[taskIndex];
  if (!task) return;
  const now = new Date().toISOString();
  if (bucketName === "Done") {
    if (!task.done) {
      task.done = true;
      task.updated = now;
    }
  } else if (task.done) {
    task.done = false;
    task.updated = now;
  }
  render();
}

document.getElementById("open").onclick = async () => {
  if (!window.showOpenFilePicker) {
    alert("Use Chrome or Edge for File System Access");
    return;
  }
  const [h] = await showOpenFilePicker({
    types: [{ description: "JSONL", accept: { "text/plain": [".jsonl"] } }],
  });
  fileHandle = h;
  const file = await h.getFile();
  const text = await file.text();
  tasks = parseJSONL(text);
  render();
};

document.getElementById("save").onclick = async () => {
  if (!fileHandle) {
    alert("Open a tasks file first");
    return;
  }
  const w = await fileHandle.createWritable();
  await w.write(toJSONL(tasks));
  await w.close();
  alert("Saved");
};

document.getElementById("loadSample").onclick = async () => {
  const res = await fetch("./tasks.sample.jsonl");
  const text = await res.text();
  tasks = parseJSONL(text);
  render();
};

render();
