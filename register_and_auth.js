import { configureLogger, Log } from "./logging_middleware/index.js";
import { loadEnvFile } from "./env_loader.js";

const SERVER_URL = "http://20.207.122.201/evaluation-service";

loadEnvFile();

const ACCESS_TOKEN =
  process.env.APP_API_TOKEN ||
  process.env.APP_LOG_TOKEN ||
  process.env.AFFORDMED_API_TOKEN ||
  process.env.AFFORDMED_LOG_TOKEN ||
  "";

configureLogger({ token: ACCESS_TOKEN });

async function readResponseBody(response) {
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

async function verifyToken() {
  if (!ACCESS_TOKEN) {
    throw new Error(
      "No access token found. Set APP_API_TOKEN in your .env file.",
    );
  }

  console.log("=== Backend Setup ===\n");
  console.log("Verifying token against protected APIs...");

  const response = await fetch(`${SERVER_URL}/depots`, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      Accept: "application/json",
    },
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    const details = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(
      `Token verification failed with status ${response.status}: ${details}`,
    );
  }

  await Log("backend", "info", "service", "token verified successfully");

  console.log("\nToken verification successful.");
  console.log("\nProtected API sample response:");
  console.log(JSON.stringify(body, null, 2));

  console.log("\nSave these in your .env file:");
  console.log(`APP_API_TOKEN=${ACCESS_TOKEN}`);
  console.log(`APP_LOG_TOKEN=${ACCESS_TOKEN}`);
}

verifyToken().catch((error) => {
  console.error("\nError during setup:", error.message);
  process.exit(1);
});
