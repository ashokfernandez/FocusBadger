export function sanitizeNumber(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseTags(value) {
  if (!value) return undefined;
  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return tags.length ? tags : undefined;
}
