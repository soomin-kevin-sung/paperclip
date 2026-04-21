#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const serverDist = path.join(repoRoot, "server", "dist");
const uiDist = path.join(repoRoot, "ui", "dist");
const rootSkills = path.join(repoRoot, "skills");
const bundledServerRoot = path.join(repoRoot, "cli", "vendor", "server");
const bundledServerDist = path.join(bundledServerRoot, "dist");
const bundledUiDist = path.join(bundledServerRoot, "ui-dist");
const bundledSkills = path.join(bundledServerRoot, "skills");

function assertExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`${label} not found: ${targetPath}`);
  }
}

function resetDir(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
  fs.mkdirSync(targetPath, { recursive: true });
}

assertExists(serverDist, "Built server dist");
assertExists(uiDist, "Built UI dist");
assertExists(rootSkills, "Root skills directory");

resetDir(bundledServerRoot);

fs.cpSync(serverDist, bundledServerDist, { recursive: true });
fs.cpSync(uiDist, bundledUiDist, { recursive: true });
fs.cpSync(rootSkills, bundledSkills, { recursive: true });

console.log("  ✓ Bundled local server dist, ui-dist, and skills into cli/vendor/server");
