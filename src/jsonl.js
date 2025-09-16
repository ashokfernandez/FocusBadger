/** Utilities for working with JSON Lines (JSONL) payloads. */
export function parseJSONL(text="") {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const items = [];
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i].trim();
    if (!raw) continue;
    try {
      items.push(JSON.parse(raw));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Invalid JSON on line ${i + 1}: ${message}`);
    }
  }
  return items;
}

export function toJSONL(records=[]) {
  if (!Array.isArray(records) || records.length === 0) return "";
  return records.map((item) => JSON.stringify(item)).join("\n");
}
