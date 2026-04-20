import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const serverDir = path.join(repoRoot, "server");
const serverEntry = path.join(serverDir, "dist", "index.js");
const tsxCandidates = [
  path.join(serverDir, "node_modules", "tsx", "dist", "cli.mjs"),
  path.join(repoRoot, "cli", "node_modules", "tsx", "dist", "cli.mjs"),
];
const uiCandidates = [
  path.join(serverDir, "ui-dist", "index.html"),
  path.join(repoRoot, "ui", "dist", "index.html"),
];

const hasServerBuild = existsSync(serverEntry);
const tsxCli = tsxCandidates.find((candidate) => existsSync(candidate)) ?? null;
const resolvedUi = uiCandidates.find((candidate) => existsSync(candidate)) ?? null;
const forwardedArgs = process.argv.slice(2);
const checkOnly = forwardedArgs.includes("--check");

if (!hasServerBuild) {
  console.error("Missing server build output: server/dist/index.js");
  console.error("Run `pnpm build` before `pnpm start`.");
  process.exit(1);
}

if (!resolvedUi) {
  console.warn("No built UI found at server/ui-dist or ui/dist.");
  console.warn("The server will still start, but static board UI may be unavailable.");
}

if (!tsxCli) {
  console.error("Missing tsx runtime needed to execute built server in the workspace.");
  console.error("Run `pnpm install` before `pnpm start`.");
  process.exit(1);
}

if (checkOnly) {
  console.log(`Server build: ${serverEntry}`);
  console.log(`Runtime: ${tsxCli}`);
  console.log(`UI build: ${resolvedUi ?? "not found"}`);
  process.exit(0);
}

const child = spawn(process.execPath, [tsxCli, serverEntry, ...forwardedArgs], {
  cwd: serverDir,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("Failed to start built server:", error);
  process.exit(1);
});
