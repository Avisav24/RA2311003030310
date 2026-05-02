import { Log, configureLogger } from "../logging_middleware/index.js";
import { loadEnvFile } from "../env_loader.js";

loadEnvFile();

const BASE_URL =
  process.env.AFFORDMED_API_URL ?? "http://20.207.122.201/evaluation-service";

const API_TOKEN = process.env.AFFORDMED_API_TOKEN ?? "";
const DEFAULT_LIMIT = Number(process.env.AFFORDMED_PRIORITY_LIMIT ?? 10);

configureLogger({
  token: process.env.AFFORDMED_LOG_TOKEN ?? API_TOKEN,
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

class TopKPriorityHeap {
  constructor(limit) {
    this.limit = limit;
    this.items = [];
  }

  size() {
    return this.items.length;
  }

  peek() {
    return this.items[0] ?? null;
  }

  push(item) {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
    Log(
      "backend",
      "debug",
      "utils",
      `heap item inserted, size now ${this.items.length}`,
    ).catch(() => {});
  }

  replaceTop(item) {
    this.items[0] = item;
    this.bubbleDown(0);
  }

  bubbleUp(index) {
    let current = index;

    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);

      if (compareNotifications(this.items[current], this.items[parent]) >= 0) {
        break;
      }

      [this.items[current], this.items[parent]] = [
        this.items[parent],
        this.items[current],
      ];
      current = parent;
    }
  }

  bubbleDown(index) {
    let current = index;

    while (true) {
      const left = current * 2 + 1;
      const right = left + 1;
      let smallest = current;

      if (
        left < this.items.length &&
        compareNotifications(this.items[left], this.items[smallest]) < 0
      ) {
        smallest = left;
      }

      if (
        right < this.items.length &&
        compareNotifications(this.items[right], this.items[smallest]) < 0
      ) {
        smallest = right;
      }

      if (smallest === current) {
        break;
      }

      [this.items[current], this.items[smallest]] = [
        this.items[smallest],
        this.items[current],
      ];
      current = smallest;
    }
  }

  insert(item) {
    if (this.limit <= 0) {
      return;
    }

    if (this.size() < this.limit) {
      this.push(item);
      return;
    }

    if (compareNotifications(item, this.peek()) > 0) {
      this.replaceTop(item);
    }
  }

  toSortedArray() {
    return [...this.items].sort((left, right) =>
      compareNotifications(right, left),
    );
  }
}

async function fetchNotificationsFromApi() {
  await Log("backend", "info", "handler", `fetching notifications from API`);

  if (!API_TOKEN) {
    await Log(
      "backend",
      "error",
      "handler",
      "AFFORDMED_API_TOKEN is not configured",
    );
    throw new Error("AFFORDMED_API_TOKEN is not configured");
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
    `processing ${notifications.length} notifications for top ${limit}`,
  ).catch(() => {});
  const heap = new TopKPriorityHeap(limit);

  let unreadCount = 0;
  for (const notification of notifications) {
    if (!notification || !isUnread(notification)) {
      continue;
    }

    unreadCount += 1;
    heap.insert(notification);
  }

  Log(
    "backend",
    "info",
    "service",
    `found ${unreadCount} unread notifications, selected top ${heap.size()}`,
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
