import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// This command prepares a directory for publishing; it never pushes.
const root = fileURLToPath(new URL("./", import.meta.url));
const base = process.argv[2] ?? "/swiftui-canvas/";
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) {
  throw new Error("Base path must be / or a path like /swiftui-canvas/.");
}
const vite = fileURLToPath(new URL("./node_modules/vite/bin/vite.js", import.meta.url));
const result = spawnSync(process.execPath, [vite, "build"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, APP_BASE_PATH: base, DO_NOT_TRACK: "1", TURBO_TELEMETRY_DISABLED: "1" },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const output = new URL("./dist/client/", import.meta.url);
const shell = await readFile(new URL("_shell.html", output), "utf8");
for (const route of ["", "components/", "glass-lab/", "compare/"]) {
  const directory = new URL(route, output);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL("index.html", directory), shell);
}
await writeFile(new URL("404.html", output), shell);
await writeFile(new URL(".nojekyll", output), "");
console.log(`Pages build ready: ${fileURLToPath(output)} (base ${base}). Nothing published.`);
