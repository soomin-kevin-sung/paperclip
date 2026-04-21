#!/usr/bin/env node
/**
 * Generate a publishable CLI package.json from the development manifest.
 *
 * The packaged CLI now vendors the local server/ui build, but that vendored
 * server still imports several published Paperclip workspace packages at
 * runtime. This script rewrites all internal workspace deps to exact versions
 * and collects the external npm deps required by the bundled runtime graph.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

function readPkg(relativePath) {
  return JSON.parse(readFileSync(resolve(repoRoot, relativePath, "package.json"), "utf8"));
}

const runtimeWorkspacePaths = [
  "cli",
  "server",
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

const allDeps = {};
const allOptionalDeps = {};

for (const pkgPath of runtimeWorkspacePaths) {
  const pkg = readPkg(pkgPath);
  const deps = pkg.dependencies || {};
  const optDeps = pkg.optionalDependencies || {};

  for (const [name, version] of Object.entries(deps)) {
    if (name.startsWith("@paperclipai/")) {
      continue;
    }

    if (!allDeps[name] || !version.startsWith("^")) {
      allDeps[name] = version;
    }
  }

  for (const [name, version] of Object.entries(optDeps)) {
    allOptionalDeps[name] = version;
  }
}

const sortedDeps = Object.fromEntries(Object.entries(allDeps).sort(([a], [b]) => a.localeCompare(b)));
const sortedOptDeps = Object.fromEntries(
  Object.entries(allOptionalDeps).sort(([a], [b]) => a.localeCompare(b)),
);

const devPkgPath = resolve(repoRoot, "cli/package.dev.json");
const cliPkg = existsSync(devPkgPath)
  ? JSON.parse(readFileSync(devPkgPath, "utf8"))
  : readPkg("cli");

const publishPkg = {
  name: cliPkg.name,
  version: cliPkg.version,
  description: cliPkg.description,
  type: cliPkg.type,
  bin: cliPkg.bin,
  keywords: cliPkg.keywords,
  license: cliPkg.license,
  repository: cliPkg.repository,
  homepage: cliPkg.homepage,
  bugs: cliPkg.bugs,
  files: Array.isArray(cliPkg.files) ? cliPkg.files : ["dist", "vendor"],
  engines: { node: ">=20" },
  dependencies: sortedDeps,
};

if (Object.keys(sortedOptDeps).length > 0) {
  publishPkg.optionalDependencies = sortedOptDeps;
}

writeFileSync(resolve(repoRoot, "cli/package.json"), `${JSON.stringify(publishPkg, null, 2)}\n`);

console.log(`  Generated publishable package.json (${Object.keys(sortedDeps).length} deps)`);
console.log(`  Version: ${cliPkg.version}`);
