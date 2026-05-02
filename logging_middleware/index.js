const DEFAULT_LOG_URL =
  process.env.APP_LOG_URL ??
  process.env.AFFORDMED_LOG_URL ??
  "http://20.207.122.201/evaluation-service/logs";
const ALLOWED_STACKS = new Set(["backend", "frontend"]);
const ALLOWED_LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const ALLOWED_PACKAGES = new Set([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "middleware",
  "utils",
]);

const loggerState = {
  token: process.env.APP_LOG_TOKEN ?? process.env.AFFORDMED_LOG_TOKEN ?? "",
  fetchImpl: globalThis.fetch ? globalThis.fetch.bind(globalThis) : null,
};

export function configureLogger({ token, fetchImpl } = {}) {
  if (typeof token === "string") {
    loggerState.token = token.trim();
  }

  if (typeof fetchImpl === "function") {
    loggerState.fetchImpl = fetchImpl;
  }
}

function validateLogField(fieldName, value, allowedValues) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  if (!allowedValues.has(value)) {
    throw new Error(
      `${fieldName} must be one of: ${Array.from(allowedValues).join(", ")}`,
    );
  }
}

function validateMessage(message) {
  if (typeof message !== "string" || !message.trim()) {
    throw new Error("message must be a non-empty string");
  }
}

async function readBody(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function Log(stack, level, packageName, message) {
  validateLogField("stack", stack, ALLOWED_STACKS);
  validateLogField("level", level, ALLOWED_LEVELS);
  validateLogField("package", packageName, ALLOWED_PACKAGES);
  validateMessage(message);

  if (!loggerState.fetchImpl) {
    throw new Error("fetch is not available in this runtime");
  }

  if (!loggerState.token) {
    throw new Error("logging token is not configured");
  }

  const response = await loggerState.fetchImpl(DEFAULT_LOG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loggerState.token}`,
    },
    body: JSON.stringify({
      stack,
      level,
      package: packageName,
      message,
    }),
  });

  const body = await readBody(response);

  if (!response.ok) {
    const details = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(
      `logging request failed with status ${response.status}: ${details}`,
    );
  }

  return body;
}

export function createLogger() {
  return Log;
}

