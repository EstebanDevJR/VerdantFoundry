/**
 * Remove node_modules and package-lock.json for a clean reinstall.
 * Run with: bun run clean:full
 * Then: bun install
 *
 * On Windows, if you get EACCES: close all terminals, stop dev/preview,
 * and optionally close Cursor/VS Code, then run again. Or delete node_modules
 * manually from Explorer.
 */
import { rmSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

const root = process.cwd();
const nodeModules = join(root, "node_modules");
const lockfile = join(root, "package-lock.json");

function removeNodeModules(): boolean {
  if (!existsSync(nodeModules)) return true;
  try {
    rmSync(nodeModules, { recursive: true, force: true, maxRetries: 2 });
    return true;
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err?.code === "EACCES" || err?.code === "EPERM") {
      // On Windows, cmd's rmdir often works when fs.rmSync is locked
      const ok = spawnSync("cmd", ["/c", "rmdir", "/s", "/q", nodeModules], {
        cwd: root,
        shell: true,
        stdio: "ignore",
      });
      if (ok.status === 0) return true;
    }
    throw e;
  }
}

try {
  if (existsSync(nodeModules)) {
    removeNodeModules();
    console.log("Removed node_modules/");
  } else {
    console.log("node_modules/ not found");
  }

  if (existsSync(lockfile)) {
    unlinkSync(lockfile);
    console.log("Removed package-lock.json");
  }

  console.log("Run: bun install");
} catch (e: unknown) {
  const err = e as NodeJS.ErrnoException;
  console.error(err?.message ?? e);
  console.error("\nIf EACCES: close all terminals, stop dev/preview, then run again.");
  console.error("Or delete the folder manually: right-click node_modules → Delete.");
  process.exit(1);
}
