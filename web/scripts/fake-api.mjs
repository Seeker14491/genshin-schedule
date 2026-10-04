// Minimal stand-in for the sync server's API, for screenshots and manual testing without real accounts.
// Usage: node scripts/fake-api.mjs [port]   (default port 5555, API at http://localhost:<port>/api/v1)
//
// POST /__fixture with { data, user } replaces the stored data and user, e.g. before taking a screenshot.
import { createServer } from "node:http";

const port = Number(process.argv[2] || process.env.PORT || 5555);

let user = { username: "traveler", discordUserId: "123456789012345678" };
let data = {};
let version = 0;

const token = () => `fake-token-${version}`;

/** Applies an RFC 6902 patch. Only supports the operations the website sends (add, replace, remove). */
function applyPatch(target, patch) {
  for (const { op, path, value } of patch) {
    const keys = path
      .split("/")
      .slice(1)
      .map((key) => key.replace(/~1/g, "/").replace(/~0/g, "~"));
    const last = keys.pop();
    const parent = keys.reduce((object, key) => object[key], target);

    if (op === "remove" && Array.isArray(parent)) {
      parent.splice(Number(last), 1);
    } else if (op === "remove") {
      delete parent[last];
    } else if (op === "add" && Array.isArray(parent)) {
      parent.splice(last === "-" ? parent.length : Number(last), 0, value);
    } else {
      parent[last] = value;
    }
  }
}

function send(res, status, body) {
  res.writeHead(status, body === undefined ? {} : { "content-type": "application/json" });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "authorization, content-type");
  res.setHeader("access-control-allow-methods", "GET, POST, PUT, PATCH, DELETE");

  if (req.method === "OPTIONS") return send(res, 204);

  let body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length) body = JSON.parse(Buffer.concat(chunks).toString());

  const path = new URL(req.url, "http://localhost").pathname.replace(/^\/api\/v1/, "");
  const route = `${req.method} ${path}`;

  if (route === "POST /__fixture") {
    if (body.data) data = body.data;
    if (body.user) user = { ...user, ...body.user };
    version++;
    return send(res, 204);
  }

  if (path !== "/auth" || req.method !== "POST") {
    if (!req.headers.authorization?.startsWith("Bearer fake-token-")) return send(res, 401, "Unauthorized.");
  }

  switch (route) {
    case "POST /auth":
      if (!body.username || !body.password) return send(res, 400, "Username and password are required.");
      if (body.password === "wrong") return send(res, 401, "Invalid username or password.");
      return send(res, 200, { token: token(), user: { ...user, username: body.username } });

    case "GET /auth":
      return send(res, 200, user);

    case "PUT /auth":
      user = { ...user, username: body.username };
      return send(res, 200, { token: token(), user });

    case "GET /sync":
      return send(res, 200, { token: token(), data });

    case "PATCH /sync":
      if (body.token !== token()) return send(res, 400, { token: token(), data });
      applyPatch(data, body.patch);
      version++;
      return send(res, 200, { token: token() });
  }

  // queued notifications are accepted, but never sent
  if (/^\/notifications\/[^/]+$/.test(path) && (req.method === "PUT" || req.method === "DELETE")) {
    return send(res, 204);
  }

  send(res, 404, "Not found.");
});

server.listen(port, () => console.log(`fake API listening on http://localhost:${port}/api/v1`));
