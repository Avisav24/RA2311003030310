// Affordmed Authentication Helper
// If you already have registration credentials, update these values:
const AUTH_CREDENTIALS = {
  email: "av4125@srmist.edu.in",
  name: "Abhinav",
  rollNo: "RA2311003030310",
  accessCode: "QkbpxH",
  clientID: "YOUR_CLIENT_ID_HERE", // Update with your actual clientID from registration
  clientSecret: "YOUR_CLIENT_SECRET_HERE", // Update with your actual clientSecret from registration
};

const SERVER_URL = "http://20.207.122.201/evaluation-service";

async function authenticate(clientID, clientSecret) {
  console.log("Authenticating with test server...");

  const authData = {
    email: AUTH_CREDENTIALS.email,
    name: AUTH_CREDENTIALS.name,
    rollNo: AUTH_CREDENTIALS.rollNo,
    accessCode: AUTH_CREDENTIALS.accessCode,
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
    console.log("=== Affordmed Authentication ===\n");

    if (
      !AUTH_CREDENTIALS.clientID ||
      AUTH_CREDENTIALS.clientID === "YOUR_CLIENT_ID_HERE"
    ) {
      console.error("Error: clientID and clientSecret are not configured.");
      console.error(
        "Please update AUTH_CREDENTIALS with your credentials from registration.",
      );
      process.exit(1);
    }

    const authResponse = await authenticate(
      AUTH_CREDENTIALS.clientID,
      AUTH_CREDENTIALS.clientSecret,
    );

    if (!authResponse.access_token) {
      throw new Error("Authentication did not return access_token");
    }

    console.log("\n=== Authentication Successful ===");
    console.log("\nSave this token in your .env file:");
    console.log(`AFFORDMED_API_TOKEN=${authResponse.access_token}`);
    console.log(`AFFORDMED_LOG_TOKEN=${authResponse.access_token}`);

    process.exit(0);
  } catch (error) {
    console.error("\nError during authentication:", error.message);
    process.exit(1);
  }
}

main();
