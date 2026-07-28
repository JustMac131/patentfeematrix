const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const dist = path.join(root, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "server"), { recursive: true });
fs.mkdirSync(path.join(dist, ".openai"), { recursive: true });

for (const file of ["index.html", "styles.css", "app.js", "favicon.svg", "README.md", "SOURCES.md"]) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
}

fs.writeFileSync(
  path.join(dist, ".openai", "hosting.json"),
  JSON.stringify({ project_id: "appgprj_6a68f67616fc8191b503f5f98e6669d6" }, null, 2)
);

fs.writeFileSync(
  path.join(dist, "server", "index.js"),
  `import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".md": "text/markdown" };

export default async function handler(request) {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\\/+/, "");
  const file = path.resolve(root, relative);
  if (!file.startsWith(root)) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(file);
    return new Response(body, { headers: { "content-type": types[path.extname(file)] || "application/octet-stream" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
`
);
