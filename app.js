import { parseJSONL, toJSONL } from "./src/jsonl.js";
import { score, bucket } from "./src/model.js";

let fileHandle = null;
let tasks = [];

/** Render simple lists into buckets. */
function render() {
  const buckets = ["Today","This week","Later","No date","Done"];
  for (const b of buckets) {
    const el = document.querySelector(`[data-bucket="${b}"]`);
    el.innerHTML = "";
    const list = tasks.filter(t => bucket(t) === b).sort((a,b)=>score(b)-score(a));
    for (const t of list) {
      const li = document.createElement("li");
      li.className = "card";
      li.textContent = `${t.done ? "[x]" : "[ ]"} ${t.title} ${t.project ? "(" + t.project + ")" : ""} ${t.due ? "due " + t.due : ""} score=${score(t)}`;
      li.onclick = () => { t.done = !t.done; render(); };
      el.appendChild(li);
    }
  }
}

document.getElementById("open").onclick = async () => {
  if (!window.showOpenFilePicker) { alert("Use Chrome or Edge for File System Access"); return; }
  const [h] = await showOpenFilePicker({ types:[{description:"JSONL", accept:{ "text/plain":[".jsonl"] }}] });
  fileHandle = h;
  const file = await h.getFile();
  const text = await file.text();
  tasks = parseJSONL(text);
  render();
};

document.getElementById("save").onclick = async () => {
  if (!fileHandle) { alert("Open a tasks file first"); return; }
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
