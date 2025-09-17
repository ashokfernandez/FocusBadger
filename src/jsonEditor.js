import { parseJSONL } from "./jsonl.js";
import { hydrateRecords } from "./projects.js";

export function buildJSONExport(tasks = [], projects = []) {
  const projectRecords = projects.map((name) => ({ type: "project", name }));
  const records = [...projectRecords, ...tasks];
  return JSON.stringify(records, null, 2);
}

function ensureObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

export function parseJSONInput(rawInput) {
  const text = (rawInput ?? "").trim();
  if (!text) {
    return { ok: false, error: "Paste JSON before saving." };
  }

  let records;
  const parseAsJson = () => {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (ensureObject(parsed)) return [parsed];
    throw new Error("JSON must be an array of records.");
  };

  try {
    if (text.startsWith("[") || text.startsWith("{")) {
      try {
        records = parseAsJson();
      } catch (jsonError) {
        records = parseJSONL(text);
      }
    } else {
      records = parseJSONL(text);
    }
  } catch (error) {
    return { ok: false, error: error.message || "Unable to parse JSON." };
  }

  if (!Array.isArray(records)) {
    return { ok: false, error: "Top-level JSON value must be an array." };
  }

  if (!records.every(ensureObject)) {
    return { ok: false, error: "Every record must be a JSON object." };
  }

  const { tasks, projects } = hydrateRecords(records);

  const invalidTask = tasks.find((task) => typeof task.title !== "string" || !task.title.trim());
  if (invalidTask) {
    return { ok: false, error: "Each task needs a non-empty title." };
  }

  return { ok: true, tasks, projects };
}
