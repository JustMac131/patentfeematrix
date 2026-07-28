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
  `const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".md": "text/markdown" };

function handler(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\\/+/, "");
  const file = path.resolve(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

module.exports = handler;
module.exports.default = handler;

if (require.main === module) {
  http.createServer(handler).listen(Number(process.env.PORT || 3000));
}
`
);
