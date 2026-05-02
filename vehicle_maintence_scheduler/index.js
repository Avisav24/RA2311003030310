import { Log, configureLogger } from "../logging_middleware/index.js";
import { loadEnvFile } from "../env_loader.js";

loadEnvFile();

const BASE_URL =
  process.env.APP_API_URL ??
  process.env.AFFORDMED_API_URL ??
  "http://20.207.122.201/evaluation-service";

const API_TOKEN = process.env.APP_API_TOKEN ?? process.env.AFFORDMED_API_TOKEN ?? "";

configureLogger({
  token: process.env.APP_LOG_TOKEN ?? process.env.AFFORDMED_LOG_TOKEN ?? API_TOKEN,
});

async function fetchJson(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
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
      `request to ${path} failed with status ${response.status}: ${details}`,
    );
  }

  return body;
}

function solveKnapsack(tasks, capacity) {
  const itemCount = tasks.length;
  const dp = Array.from({ length: itemCount + 1 }, () =>
    Array(capacity + 1).fill(0),
  );

  for (let index = 1; index <= itemCount; index += 1) {
    const task = tasks[index - 1];

    for (let hours = 0; hours <= capacity; hours += 1) {
      const skip = dp[index - 1][hours];
      const take =
        task.duration <= hours
          ? dp[index - 1][hours - task.duration] + task.impact
          : Number.NEGATIVE_INFINITY;
      dp[index][hours] = Math.max(skip, take);
    }
  }

  const selected = [];
  let hoursLeft = capacity;

  for (let index = itemCount; index >= 1; index -= 1) {
    if (dp[index][hoursLeft] !== dp[index - 1][hoursLeft]) {
      const task = tasks[index - 1];
      selected.push(task);
      hoursLeft -= task.duration;
    }
  }

  selected.reverse();

  return {
    selected,
    totalDuration: selected.reduce((sum, task) => sum + task.duration, 0),
    totalImpact: selected.reduce((sum, task) => sum + task.impact, 0),
  };
}

function normalizeTasks(rawVehicles) {
  if (!Array.isArray(rawVehicles)) {
    throw new Error("vehicles payload must contain an array");
  }

  return rawVehicles
    .map((vehicle, index) => ({
      id: vehicle.TaskID ?? vehicle.id ?? `task-${index + 1}`,
      duration: Number(vehicle.Duration ?? vehicle.duration ?? 0),
      impact: Number(vehicle.Impact ?? vehicle.impact ?? 0),
    }))
    .filter(
      (vehicle) =>
        Number.isFinite(vehicle.duration) &&
        Number.isFinite(vehicle.impact) &&
        vehicle.duration > 0,
    );
}

async function buildSchedule() {
  if (!API_TOKEN) {
    throw new Error("APP_API_TOKEN is not configured");
  }

  const [depotPayload, vehiclePayload] = await Promise.all([
    fetchJson("/depots"),
    fetchJson("/vehicles"),
  ]);

  const depots = Array.isArray(depotPayload?.depots) ? depotPayload.depots : [];
  const vehicles = normalizeTasks(vehiclePayload?.vehicles ?? vehiclePayload);

  if (!depots.length) {
    throw new Error("no depots were returned by the API");
  }

  if (!vehicles.length) {
    throw new Error("no vehicles were returned by the API");
  }

  const schedule = [];

  for (const depot of depots) {
    const depotId = depot.ID ?? depot.id;
    const mechanicHours = Number(
      depot.MechanicHours ?? depot.mechanicHours ?? 0,
    );

    if (!Number.isFinite(mechanicHours) || mechanicHours <= 0) {
      continue;
    }

    await Log(
      "backend",
      "info",
      "cron_job",
      `planning maintenance for depot ${depotId} with ${mechanicHours} hours`,
    );

    const plan = solveKnapsack(vehicles, mechanicHours);

    schedule.push({
      depotId,
      mechanicHours,
      ...plan,
      selected: plan.selected.map((task) => ({
        taskId: task.id,
        duration: task.duration,
        impact: task.impact,
      })),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    depots: schedule,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildSchedule()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(async (error) => {
      try {
        await Log("backend", "error", "cron_job", error.message);
      } catch {}

      console.error(error.message);
      process.exit(1);
    });
}

export { buildSchedule, solveKnapsack };
