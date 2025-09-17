import { bucket } from "../model.js";

export function getUrgencyStatus(task, now = new Date()) {
  const rawUrgency = task?.urgency;
  const urgencyScore = rawUrgency ?? 0;
  const dueBucket = bucket(task, now);
  const isUrgent = urgencyScore >= 3 || (rawUrgency == null && dueBucket === "Today");

  if (isUrgent) {
    return { label: "Urgent", colorScheme: "pink" };
  }

  return { label: "Can wait", colorScheme: "teal" };
}

export function getImportanceStatus(task) {
  const importanceScore = task?.importance ?? 0;
  const isImportant = importanceScore >= 3;

  if (isImportant) {
    return { label: "Important", colorScheme: "purple" };
  }

  return { label: "Low priority", colorScheme: "gray" };
}
