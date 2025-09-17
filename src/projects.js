import { toJSONL } from "./jsonl.js";

export const compareInsensitive = (a, b) =>
  a.localeCompare(b, undefined, { sensitivity: "base" });

export const sortProjects = (projects) =>
  projects.slice().sort(compareInsensitive);

export function collectProjects(tasks = [], projectRecords = []) {
  const names = new Set();
  projectRecords
    .map((record) => record?.name?.trim())
    .filter(Boolean)
    .forEach((name) => names.add(name));
  tasks
    .map((task) => task?.project?.trim())
    .filter(Boolean)
    .forEach((name) => names.add(name));
  return sortProjects(Array.from(names));
}

export function hydrateRecords(records = []) {
  const tasks = [];
  const projectRecords = [];
  records.forEach((record) => {
    if (record?.type === "project" && record.name) {
      projectRecords.push({ type: "project", name: record.name });
    } else if (record) {
      const { type, ...rest } = record;
      tasks.push(rest);
    }
  });
  const projects = collectProjects(tasks, projectRecords);
  return { tasks, projects };
}

export function buildSnapshot(tasks = [], projects = []) {
  const projectRecords = projects.map((name) => ({ type: "project", name }));
  return toJSONL([...projectRecords, ...tasks]);
}

export function addProject(projects = [], name) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) {
    return { ok: false, message: "Project name is required" };
  }
  const exists = projects.some(
    (project) => project.toLowerCase() === trimmed.toLowerCase()
  );
  if (exists) {
    return { ok: false, message: "Project already exists" };
  }
  const updated = sortProjects([...projects, trimmed]);
  return { ok: true, projects: updated, name: trimmed };
}

export function renameProject(projects = [], tasks = [], oldName, newName, timestamp) {
  const trimmed = (newName ?? "").trim();
  if (!trimmed) {
    return { ok: false, message: "Project name is required" };
  }
  if (trimmed.toLowerCase() === oldName.toLowerCase()) {
    return { ok: true, projects, tasks, name: oldName };
  }
  const exists = projects.some(
    (project) => project.toLowerCase() === trimmed.toLowerCase()
  );
  if (exists) {
    return { ok: false, message: "Project already exists" };
  }
  const updatedProjects = sortProjects(
    projects.map((project) => (project === oldName ? trimmed : project))
  );
  const iso = timestamp ?? new Date().toISOString();
  const updatedTasks = tasks.map((task) =>
    task.project === oldName ? { ...task, project: trimmed, updated: iso } : task
  );
  return { ok: true, projects: updatedProjects, tasks: updatedTasks, name: trimmed };
}

export function deleteProject(projects = [], tasks = [], name, timestamp) {
  const updatedProjects = projects.filter((project) => project !== name);
  const iso = timestamp ?? new Date().toISOString();
  const updatedTasks = tasks.map((task) =>
    task.project === name ? { ...task, project: undefined, updated: iso } : task
  );
  return { ok: true, projects: updatedProjects, tasks: updatedTasks };
}
