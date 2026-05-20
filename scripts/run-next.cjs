/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const pnpmStore = path.join(projectRoot, "node_modules", ".pnpm");

function findPackageDir(prefix) {
  if (!fs.existsSync(pnpmStore)) {
    return path.join(projectRoot, "node_modules");
  }

  const entries = fs.readdirSync(pnpmStore, { withFileTypes: true });
  const match = entries.find((entry) => entry.isDirectory() && entry.name.startsWith(prefix));

  if (!match) {
    console.error(`No se encontro ${prefix} en node_modules/.pnpm`);
    process.exit(1);
  }

  return path.join(pnpmStore, match.name, "node_modules");
}

const nextNodeModules = findPackageDir("next@");
const nextCli = path.join(nextNodeModules, "next", "dist", "bin", "next");

const result = spawnSync(process.execPath, [nextCli, ...process.argv.slice(2)], {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_PATH: nextNodeModules,
  },
});

process.exit(result.status ?? 1);
