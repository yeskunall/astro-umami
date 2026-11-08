import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const playgroundDirectory = join(scriptsDirectory, "..");
const fixtureDirectory = join(playgroundDirectory, "fixtures", "production");
const { variants } = JSON.parse(
  readFileSync(join(fixtureDirectory, "variants.json"), "utf8"),
);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function createFixtureServer(variant) {
  const root = join(fixtureDirectory, `dist-${variant.name}`);

  return createServer((request, response) => {
    let pathname;

    try {
      pathname = decodeURIComponent(
        new URL(request.url ?? "/", "http://localhost").pathname,
      );
    }
    catch {
      response.writeHead(400);
      response.end("Bad request");
      return;
    }

    const filePath = normalize(
      pathname === "/" ? join(root, "index.html") : join(root, pathname),
    );

    if (!filePath.startsWith(root) || !existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const resolvedPath = statSync(filePath).isDirectory()
      ? join(filePath, "index.html")
      : filePath;

    if (!existsSync(resolvedPath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type":
        contentTypes[extname(resolvedPath)] ?? "application/octet-stream",
    });
    createReadStream(resolvedPath).pipe(response);
  });
}

// The first variant's port is Playwright's readiness probe, so bind it last.
// By the time that probe succeeds, every other fixture server is already listening.
const [readinessVariant, ...remainingVariants] = variants;

if (!readinessVariant) {
  throw new Error("Expected at least one production fixture variant");
}

const orderedVariants = [...remainingVariants, readinessVariant];
const servers = [];

for (const variant of orderedVariants) {
  const root = join(fixtureDirectory, `dist-${variant.name}`);

  if (!existsSync(join(root, "index.html"))) {
    throw new Error(
      `Missing production build for "${variant.name}". Run \`pnpm fixture:build\` first.`,
    );
  }

  const server = createFixtureServer(variant);

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(variant.port, () => {
      console.log(
        `Serving "${variant.name}" at http://localhost:${variant.port}`,
      );
      resolve();
    });
  });

  servers.push(server);
}

function shutdown() {
  let pending = servers.length;

  if (pending === 0) {
    process.exit(0);
  }

  for (const server of servers) {
    server.close(() => {
      pending -= 1;

      if (pending === 0) {
        process.exit(0);
      }
    });
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
