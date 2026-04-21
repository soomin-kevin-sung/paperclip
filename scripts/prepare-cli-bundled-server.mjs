#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const bundledRoot = path.join(repoRoot, "cli", "vendor");
const bundledServerRoot = path.join(bundledRoot, "server");
const bundledServerDist = path.join(bundledServerRoot, "dist");
const bundledUiDist = path.join(bundledServerRoot, "ui-dist");
const bundledSkills = path.join(bundledServerRoot, "skills");
const bundledNodeModules = path.join(bundledRoot, "node_modules");

const serverDist = path.join(repoRoot, "server", "dist");
const serverPackageJsonPath = path.join(repoRoot, "server", "package.json");
const uiDist = path.join(repoRoot, "ui", "dist");
const rootSkills = path.join(repoRoot, "skills");

const vendoredWorkspacePackages = [
  "packages/db",
  "packages/shared",
  "packages/adapter-utils",
  "packages/adapters/claude-local",
  "packages/adapters/codex-local",
  "packages/adapters/cursor-local",
  "packages/adapters/gemini-local",
  "packages/adapters/opencode-local",
  "packages/adapters/openclaw-gateway",
  "packages/adapters/pi-local",
  "packages/plugins/sdk",
];

function assertExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`${label} not found: ${targetPath}`);
  }
}

function resetDir(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
  fs.mkdirSync(targetPath, { recursive: true });
}

function readJson(targetPath) {
  return JSON.parse(fs.readFileSync(targetPath, "utf8"));
}

function writeJson(targetPath, value) {
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`);
}

function buildRuntimePackageJson(pkg) {
  const publishConfig = pkg.publishConfig ?? {};
  return {
    name: pkg.name,
    version: pkg.version,
    type: pkg.type ?? "module",
    exports: publishConfig.exports ?? pkg.exports,
    main: publishConfig.main,
    types: publishConfig.types,
    bin: pkg.bin,
  };
}

assertExists(serverDist, "Built server dist");
assertExists(serverPackageJsonPath, "Server package.json");
assertExists(uiDist, "Built UI dist");
assertExists(rootSkills, "Root skills directory");

resetDir(bundledRoot);

fs.cpSync(serverDist, bundledServerDist, { recursive: true });
fs.cpSync(uiDist, bundledUiDist, { recursive: true });
fs.cpSync(rootSkills, bundledSkills, { recursive: true });
writeJson(path.join(bundledServerRoot, "package.json"), buildRuntimePackageJson(readJson(serverPackageJsonPath)));

for (const relativePkgPath of vendoredWorkspacePackages) {
  const packageRoot = path.join(repoRoot, relativePkgPath);
  const packageJsonPath = path.join(packageRoot, "package.json");
  const pkg = readJson(packageJsonPath);
  const targetRoot = path.join(bundledNodeModules, ...pkg.name.split("/"));
  const targetDist = path.join(targetRoot, "dist");
  const sourceDist = path.join(packageRoot, "dist");

  assertExists(sourceDist, `Built dist for ${pkg.name}`);
  fs.mkdirSync(targetRoot, { recursive: true });
  fs.cpSync(sourceDist, targetDist, { recursive: true });

  const sourceSkills = path.join(packageRoot, "skills");
  if (fs.existsSync(sourceSkills)) {
    fs.cpSync(sourceSkills, path.join(targetRoot, "skills"), { recursive: true });
  }

  writeJson(path.join(targetRoot, "package.json"), buildRuntimePackageJson(pkg));
}

console.log("  Bundled local server dist, ui-dist, skills, and internal runtime packages into cli/vendor");
