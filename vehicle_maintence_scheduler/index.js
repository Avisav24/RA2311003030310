import { Log, configureLogger } from "../logging_middleware/index.js";
import { solveKnapsack } from "./knapsack.js";
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

configureLogger({
  token:
    process.env.APP_LOG_TOKEN ?? process.env.AFFORDMED_LOG_TOKEN ?? API_TOKEN,
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
