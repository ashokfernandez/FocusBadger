import { bucket } from "../model.js";

function isUrgent(task, now) {
  const rawUrgency = task?.urgency;
  const urgencyScore = rawUrgency ?? 0;
  if (urgencyScore >= 3) return true;
  if (rawUrgency == null) {
    return bucket(task, now) === "Today";
  }
  return false;
}

function isImportant(task) {
  const importanceScore = task?.importance ?? 0;
  return importanceScore >= 3;
}

export function deriveTaskPriority(task, now = new Date()) {
  const urgent = isUrgent(task, now);
  const important = isImportant(task);

  return {
    isUrgent: urgent,
    isImportant: important,
    urgencyLabel: urgent ? "Urgent" : "Can wait",
    urgencyColorScheme: urgent ? "red" : "cyan",
    importanceLabel: important ? "Important" : "Low priority",
    importanceColorScheme: important ? "purple" : "gray"
  };
}
