let assistantPromptTemplate;

try {
  const mod = await import("./ASSISTANT_PROMPT.md?raw");
  assistantPromptTemplate = typeof mod === "string" ? mod : mod.default;
} catch (error) {
  if (typeof process !== "undefined" && process.versions?.node) {
    const fs = await import("node:fs/promises");
    const fileUrl = new URL("./ASSISTANT_PROMPT.md", import.meta.url);
    assistantPromptTemplate = await fs.readFile(fileUrl, "utf8");
  } else {
    throw error;
  }
}

if (typeof assistantPromptTemplate !== "string") {
  throw new Error("Unable to load assistant prompt template");
}

export default assistantPromptTemplate;
