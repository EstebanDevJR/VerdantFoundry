/**
 * Remove dist/ (cross-platform). Run with: bun run clean
 */
import { rmSync, existsSync } from "fs";
import { join } from "path";

const dist = join(process.cwd(), "dist");
if (existsSync(dist)) {
  rmSync(dist, { recursive: true });
  console.log("Cleaned dist/");
} else {
  console.log("dist/ already clean");
}
