#!/usr/bin/env node
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const source = resolve(projectRoot, "assets/logo.png");
const outputDir = resolve(projectRoot, "public");

const pngTargets = [
  { size: 512, file: "favicon.png" },
  { size: 256, file: "favicon-256.png" },
  { size: 192, file: "favicon-192.png" },
  { size: 128, file: "favicon-128.png" },
  { size: 64, file: "favicon-64.png" },
  { size: 48, file: "favicon-48.png" },
  { size: 32, file: "favicon-32.png" },
  { size: 16, file: "favicon-16.png" },
  { size: 180, file: "apple-touch-icon.png" }
];

const icoSizes = [16, 32, 48, 64, 128, 256];

async function ensureOutputDir() {
  await mkdir(outputDir, { recursive: true });
}

async function generatePngs() {
  const sipsArgs = process.platform === "darwin";
  if (!sipsArgs) {
    throw new Error("Icon generation currently requires macOS (sips command not available)");
  }

  await Promise.all(
    pngTargets.map(async ({ size, file }) => {
      const dest = resolve(outputDir, file);
      await exec("sips", ["-Z", String(size), source, "--out", dest]);
      return dest;
    })
  );
}

async function createFaviconIco() {
  const entries = [];
  const images = [];
  for (const size of icoSizes) {
    const filename = size === 180 ? null : `favicon-${size}.png`;
    if (!filename) continue;
    const filePath = resolve(outputDir, filename);
    try {
      const data = await readFile(filePath);
      entries.push({ size, data });
      images.push(data);
    } catch (error) {
      if (size <= 64) {
        throw new Error(`Missing required favicon layer: ${filename}`);
      }
    }
  }

  if (!entries.length) {
    throw new Error("No favicon layers were generated");
  }

  const headerSize = 6;
  const entrySize = 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type icon
  header.writeUInt16LE(entries.length, 4);

  const entriesBuffer = Buffer.alloc(entrySize * entries.length);
  let offset = headerSize + entriesBuffer.length;

  entries.forEach(({ size, data }, index) => {
    const entry = entriesBuffer.subarray(index * entrySize, (index + 1) * entrySize);
    const dimension = size >= 256 ? 0 : size;
    entry.writeUInt8(dimension, 0);
    entry.writeUInt8(dimension, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(0, 4); // planes
    entry.writeUInt16LE(0, 6); // bit count
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
  });

  const icoBuffer = Buffer.concat([header, entriesBuffer, ...images]);
  await writeFile(resolve(outputDir, "favicon.ico"), icoBuffer);
}

async function copyLogo() {
  await copyFile(source, resolve(outputDir, "logo.png"));
}

async function main() {
  await ensureOutputDir();
  await generatePngs();
  await createFaviconIco();
  await copyLogo();
  console.log("Favicons generated successfully.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
