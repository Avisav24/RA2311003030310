import http from "node:http";
import { URL } from "node:url";
import { Log, configureLogger } from "./logging_middleware/index.js";
import { loadEnvFile } from "./env_loader.js";
import { buildSchedule } from "./vehicle_maintence_scheduler/index.js";
import { fetchTopNotifications } from "./notification_app_be/index.js";

loadEnvFile();

const PORT = Number(process.env.PORT ?? 8080);
const TOKEN =
  process.env.APP_LOG_TOKEN ??
  process.env.APP_API_TOKEN ??
  process.env.AFFORDMED_LOG_TOKEN ??
  process.env.AFFORDMED_API_TOKEN ??
  "";

configureLogger({ token: TOKEN });

function sendJson(response, statusCode, payload, startedAt) {
  const responseTimeMs = Date.now() - startedAt;
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(
    JSON.stringify(
      {
        ...payload,
        responseTimeMs,
      },
      null,
      2,
    ),
  );
}

async function safeLog(stack, level, packageName, message) {
  try {
    await Log(stack, level, packageName, message);
  } catch {
    // If logging fails, API functionality should still continue.
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;
    });

    request.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });

    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  const startedAt = Date.now();
  const method = request.method ?? "GET";
  const parsedUrl = new URL(request.url ?? "/", `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  await safeLog(
    "backend",
    "info",
    "route",
    `${method} ${pathname} request received`,
  );

  try {
    if (method === "GET" && pathname === "/api/health") {
      sendJson(
        response,
        200,
        { ok: true, message: "Local API is running" },
        startedAt,
      );
      return;
    }

    if (method === "POST" && pathname === "/api/logs") {
      const body = await readRequestBody(request);
      const result = await Log(
        body.stack,
        body.level,
        body.package,
        body.message,
      );
      sendJson(response, 200, { ok: true, result }, startedAt);
      return;
    }

    if (method === "GET" && pathname === "/api/scheduler") {
      const result = await buildSchedule();
      sendJson(response, 200, { ok: true, result }, startedAt);
      return;
    }

    if (method === "GET" && pathname === "/api/notifications/priority") {
      const limit = Number(parsedUrl.searchParams.get("limit") ?? 10);
      const result = await fetchTopNotifications(limit);
      sendJson(
        response,
        200,
        {
          ok: true,
          result,
        },
        startedAt,
      );
      return;
    }

    sendJson(response, 404, { ok: false, error: "Route not found" }, startedAt);
  } catch (error) {
    await safeLog("backend", "error", "handler", error.message);
    sendJson(
      response,
      500,
      {
        ok: false,
        error: error.message,
      },
      startedAt,
    );
  }
});

server.listen(PORT, async () => {
  await safeLog(
    "backend",
    "info",
    "service",
    `local API started on port ${PORT}`,
  );
  console.log(`Server running at http://localhost:${PORT}`);
});
