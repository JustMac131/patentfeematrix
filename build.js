const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const dist = path.join(root, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, "server"), { recursive: true });
fs.mkdirSync(path.join(dist, ".openai"), { recursive: true });

const siteFiles = ["index.html", "styles.css", "app.js", "favicon.svg", "README.md", "SOURCES.md"];
for (const file of siteFiles) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
}

fs.writeFileSync(
  path.join(dist, ".openai", "hosting.json"),
  JSON.stringify({ project_id: "appgprj_6a68f67616fc8191b503f5f98e6669d6" }, null, 2)
);

fs.writeFileSync(
  path.join(dist, "server", "index.js"),
  `const assets = ${JSON.stringify(Object.fromEntries(siteFiles.map((file) => ["/" + file, fs.readFileSync(path.join(root, file), "utf8")])))};
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".md": "text/markdown" };

function handler(request) {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  const key = pathname === "/" ? "/index.html" : pathname;
  const body = assets[key];
  if (body === undefined) return new Response("Not found", { status: 404 });
  const extension = key.slice(key.lastIndexOf("."));
  return new Response(body, { headers: { "content-type": types[extension] || "application/octet-stream" } });
}

export default { fetch: handler };
`
);
