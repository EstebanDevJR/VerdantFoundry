/**
 * Serve the production build (dist/) for local preview.
 * Replaces `vite preview`. Run with: bun run preview
 */
const port = Number(process.env.PORT ?? 3000);
const root = "./dist";

const server = Bun.serve({
  port,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    if (!pathname.startsWith("/")) pathname = "/" + pathname;
    const file = Bun.file(root + pathname);
    if (await file.exists()) {
      return new Response(file);
    }
    // SPA fallback: serve index.html for client-side routes
    const index = Bun.file(root + "/index.html");
    if (await index.exists()) {
      return new Response(index, {
        headers: { "Content-Type": "text/html" },
      });
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Preview server → http://localhost:${server.port}`);
