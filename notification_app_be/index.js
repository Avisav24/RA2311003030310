import { Log, configureLogger } from "../logging_middleware/index.js";
import { TopKHeap } from "./heap.js";
import fs from "node:fs";
import path from "node:path";

// Inline env loader — no external dependencies
(function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {}
})();

const BASE_URL =
  process.env.APP_API_URL ??
  process.env.AFFORDMED_API_URL ??
  "http://20.207.122.201/evaluation-service";

const API_TOKEN =
  process.env.APP_API_TOKEN ?? process.env.AFFORDMED_API_TOKEN ?? "";
const DEFAULT_LIMIT = Number(
  process.env.APP_PRIORITY_LIMIT ?? process.env.AFFORDMED_PRIORITY_LIMIT ?? 10,
);

configureLogger({
  token:
    process.env.APP_LOG_TOKEN ?? process.env.AFFORDMED_LOG_TOKEN ?? API_TOKEN,
});

const PRIORITY_WEIGHT = new Map([
  ["Placement", 3],
  ["Result", 2],
  ["Event", 1],
]);

function parseTimestamp(value) {
  const parsed = new Date(value ?? 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function notificationPriority(notification) {
  const type = String(notification.Type ?? notification.type ?? "").trim();
  const weight = PRIORITY_WEIGHT.get(type) ?? 0;
  const timestamp = parseTimestamp(
    notification.Timestamp ?? notification.timestamp ?? notification.createdAt,
  );
  return { weight, timestamp };
}

function compareNotifications(left, right) {
  const leftPriority = notificationPriority(left);
  const rightPriority = notificationPriority(right);

  if (leftPriority.weight !== rightPriority.weight) {
    return leftPriority.weight - rightPriority.weight;
  }

  return leftPriority.timestamp - rightPriority.timestamp;
}

async function fetchNotificationsFromApi() {
  await Log("backend", "info", "handler", `fetching notifications from API`);

  if (!API_TOKEN) {
    await Log("backend", "error", "handler", "APP_API_TOKEN is not configured");
    throw new Error("APP_API_TOKEN is not configured");
  }

  const response = await fetch(`${BASE_URL}/notifications`, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      Accept: "application/json",
    },
  });

  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const details = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(
      `notification API request failed with status ${response.status}: ${details}`,
    );
  }

  const notifications = Array.isArray(body?.notifications)
    ? body.notifications
    : Array.isArray(body)
      ? body
      : [];
  return notifications;
}

function isUnread(notification) {
  if ("isRead" in notification) {
    return notification.isRead === false;
  }

  if ("read" in notification) {
    return notification.read === false;
  }

  return true;
}

export function getTopNotifications(notifications, limit = DEFAULT_LIMIT) {
  Log(
    "backend",
    "info",
    "service",
    `processing ${notifications.length} notifications for top-${limit} priority inbox`,
  ).catch(() => {});

  const heap = new TopKHeap(limit, compareNotifications);

  let unreadCount = 0;
  for (const notification of notifications) {
    if (!notification || !isUnread(notification)) continue;
    unreadCount += 1;
    heap.insert(notification);
  }

  Log(
    "backend",
    "info",
    "service",
    `found ${unreadCount} unread notifications, returning top ${heap.size()}`,
  ).catch(() => {});

  return heap.toSortedArray().map((notification) => ({
    ID: notification.ID ?? notification.id,
    Type: notification.Type ?? notification.type,
    Message: notification.Message ?? notification.message,
    Timestamp:
      notification.Timestamp ??
      notification.timestamp ??
      notification.createdAt,
  }));
}

export async function fetchTopNotifications(limit = DEFAULT_LIMIT) {
  const notifications = await fetchNotificationsFromApi();
  return getTopNotifications(notifications, limit);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchTopNotifications(DEFAULT_LIMIT)
    .then((notifications) => {
      console.log(JSON.stringify({ topNotifications: notifications }, null, 2));
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
