import { configureLogger, Log } from "./logging_middleware/index.js";

const SERVER_URL = "http://20.207.122.201/evaluation-service";

const REGISTRATION_DATA = {
  email: "av4125@srmist.edu.in",
  name: "Abhinav",
  mobileNo: "9999999999",
  githubUsername: "your-github-username",
  rollNo: "RA2311003030310",
  accessCode: "QkbpxH",
};

async function register() {
  console.log("Registering with test server...");

  const response = await fetch(`${SERVER_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(REGISTRATION_DATA),
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
      `Registration failed with status ${response.status}: ${details}`,
    );
  }

  console.log("\nRegistration Response:");
  console.log(JSON.stringify(body, null, 2));

  return body;
}

async function authenticate(clientID, clientSecret) {
  console.log("\nAuthenticating with test server...");

  const authData = {
    email: REGISTRATION_DATA.email,
    name: REGISTRATION_DATA.name,
    rollNo: REGISTRATION_DATA.rollNo,
    accessCode: REGISTRATION_DATA.accessCode,
    clientID,
    clientSecret,
  };

  const response = await fetch(`${SERVER_URL}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(authData),
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
      `Authentication failed with status ${response.status}: ${details}`,
    );
  }

  console.log("\nAuthentication Response:");
  console.log(JSON.stringify(body, null, 2));

  return body;
}

async function main() {
  try {
    console.log("=== Affordmed Pre-Test Setup ===\n");

    const registrationResponse = await register();

    if (!registrationResponse.clientID || !registrationResponse.clientSecret) {
      throw new Error("Registration did not return clientID or clientSecret");
    }

    const authResponse = await authenticate(
      registrationResponse.clientID,
      registrationResponse.clientSecret,
    );

    if (!authResponse.access_token) {
      throw new Error("Authentication did not return access_token");
    }

    console.log("\n=== Setup Complete ===");
    console.log(
      "\nSave these values in your .env file or as environment variables:",
    );
    console.log(`AFFORDMED_API_TOKEN=${authResponse.access_token}`);
    console.log(`AFFORDMED_LOG_TOKEN=${authResponse.access_token}`);
    console.log(`AFFORDMED_CLIENT_ID=${registrationResponse.clientID}`);
    console.log(`AFFORDMED_CLIENT_SECRET=${registrationResponse.clientSecret}`);

    process.exit(0);
  } catch (error) {
    console.error("\nError during setup:", error.message);
    process.exit(1);
  }
}

main();
