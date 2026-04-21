import { createRequire } from "node:module";

type PackageJson = {
  version?: string;
};

const require = createRequire(import.meta.url);
let pkg: PackageJson = {};

try {
  pkg = require("../package.json") as PackageJson;
} catch {
  pkg = {};
}

export const serverVersion = pkg.version ?? "0.0.0";
