/** Parse JSON Lines text to array. Ignore blank lines and lines that start with #. */
export function parseJSONL(text) {
  const out = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    out.push(JSON.parse(line));
  }
  return out;
}

/** Stringify array of objects to JSON Lines with trailing newline. */
export function toJSONL(arr) {
  return arr.map(o => JSON.stringify(o)).join("\n") + "\n";
}
