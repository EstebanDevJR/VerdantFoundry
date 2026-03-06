/**
 * Production build script using Bun's bundler.
 * Replaces `vite build`. Run with: bun run build
 *
 * Bun loads .env automatically; GEMINI_API_KEY is inlined via define.
 */
import tailwind from "bun-plugin-tailwind";

const outdir = "./dist";

const result = await Bun.build({
  entrypoints: ["./index.html"],
  outdir,
  minify: true,
  define: {
    "process.env.GEMINI_API_KEY": JSON.stringify(
      process.env.GEMINI_API_KEY ?? ""
    ),
  },
  plugins: [tailwind],
});

if (!result.success) {
  console.error("Build failed:");
  for (const msg of result.logs) {
    console.error(msg);
  }
  process.exit(1);
}

console.log(`Build complete → ${outdir}`);
