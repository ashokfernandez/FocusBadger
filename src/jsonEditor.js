import { parseJSONL } from "./jsonl.js";
import { hydrateRecords } from "./projects.js";
import assistantPromptTemplate from "./prompts/assistantPrompt.js";
import { applyOperations } from "./operations.js";

const PROMPT_CONTEXT = [
  "FocusBadger is a local-first planning board that stores every project and task in a JSON Lines file.",
  "Projects are declared before tasks, and each task carries optional metadata for priority scoring."
].join(" ");

const PROMPT_GOALS = [
  "- Keep changes focused on the request that accompanies this prompt.",
  "- Preserve untouched tasks verbatim so diffs stay small and easy to review.",
  "- Highlight next steps or blockers when the user asks for strategy help."
].join("\n");

const PROMPT_EXPECTED_OUTPUT = [
  "- Reply with a JSON object that contains an operations array and nothing else.",
  "- Use the allowed operation shapes below with required fields present.",
  "- Maintain ids and timestamps for existing tasks; use ISO 8601 UTC for new timestamps.",
  "- Do not include commentary outside of the JSON code block."
].join("\n");

function fillPromptTemplate(template, values) {
  return template.replace(/{{(\w+)}}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return values[key];
    }
    return match;
  });
}

export function buildJSONExport(tasks = [], projects = []) {
  const projectRecords = projects.map((name) => ({ type: "project", name }));
  const allRecords = [...projectRecords, ...tasks];
  const openTasks = tasks.filter((task) => !task?.done);
  const openRecords = [...projectRecords, ...openTasks];
  const data = JSON.stringify(allRecords, null, 2);
  const clipboardData = JSON.stringify(openRecords, null, 2);
  const clipboardPrompt = fillPromptTemplate(assistantPromptTemplate, {
    context: PROMPT_CONTEXT,
    goals: PROMPT_GOALS,
    expectedOutput: PROMPT_EXPECTED_OUTPUT,
    data: clipboardData
  });

  const clipboardText = `# FocusBadger Assistant Briefing\n\n${clipboardPrompt}`;

  return { data, clipboardText, clipboardData };
}

function ensureObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

export function parseJSONInput(rawInput, options = {}) {
  const { baseTasks = [], baseProjects = [], now } = options;
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

  if (records.length === 1 && Array.isArray(records[0]?.operations)) {
    const applied = applyOperations(records[0], baseTasks, baseProjects, now);
    if (!applied.ok) {
      return { ok: false, error: applied.error };
    }
    return { ok: true, tasks: applied.tasks, projects: applied.projects, origin: "operations" };
  }

  const { tasks, projects } = hydrateRecords(records);

  const invalidTask = tasks.find((task) => typeof task.title !== "string" || !task.title.trim());
  if (invalidTask) {
    return { ok: false, error: "Each task needs a non-empty title." };
  }

  return { ok: true, tasks, projects, origin: "records" };
}
