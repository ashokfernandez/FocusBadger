import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const targetDir = path.join(ROOT, "public", "web", "PolySynth");
const outputDir = process.env.IPLUG2_WEB_BUILD_OUTPUT;
const buildCommand = process.env.IPLUG2_WEB_BUILD_COMMAND;

function copyDirectory(sourceDir, destinationDir) {
  fs.rmSync(destinationDir, { recursive: true, force: true });
  fs.mkdirSync(destinationDir, { recursive: true });
  fs.cpSync(sourceDir, destinationDir, { recursive: true });
}

if (buildCommand) {
  console.log(`Running iPlug2 web build command: ${buildCommand}`);
  execSync(buildCommand, { cwd: ROOT, stdio: "inherit" });
}

if (!outputDir) {
  console.log("IPLUG2_WEB_BUILD_OUTPUT not set. Keeping committed web demo assets.");
  process.exit(0);
}

const sourceDir = path.resolve(ROOT, outputDir);
if (!fs.existsSync(sourceDir)) {
  throw new Error(`Configured iPlug2 output directory does not exist: ${sourceDir}`);
}

copyDirectory(sourceDir, targetDir);
console.log(`Copied iPlug2 web bundle from ${sourceDir} to ${targetDir}`);
