# Affordmed Backend Assessment

This repository contains the backend implementation for the Affordmed Campus Hiring Evaluation. The solution includes a reusable logging middleware, a vehicle maintenance scheduler, and a campus notification system with priority inbox functionality.

## Project Structure

```
.
├── logging_middleware/          # Reusable logging package
│   └── index.js
├── vehicle_maintence_scheduler/ # Vehicle maintenance scheduling
│   └── index.js
├── notification_app_be/         # Notification system with priority inbox
│   └── index.js
├── notification_system_design.md  # Design document (Stages 1-6)
├── register_and_auth.js         # Registration and authentication helper
├── package.json
├── .env.example
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18 or higher
- Network access to `http://20.207.122.201/evaluation-service`

### 2. Environment Configuration

Create a `.env` file in the root directory using `.env.example` as a template:

```bash
cp .env.example .env
```

Then update the values in `.env`:

- `AFFORDMED_API_URL`: The test server base URL (default: `http://20.207.122.201/evaluation-service`)
- `AFFORDMED_API_TOKEN`: Your access token (obtained after registration)
- `AFFORDMED_LOG_TOKEN`: Your logging token (same as API token)
- `AFFORDMED_PRIORITY_LIMIT`: Number of top notifications to return (default: 10)

### 3. Registration and Authentication

Run the registration script to obtain your credentials:

```bash
node register_and_auth.js
```

This will:

1. Register your account with the test server
2. Receive `clientID` and `clientSecret`
3. Authenticate to get the `access_token`
4. Display the token for use in your `.env` file

**Important**: Save your `clientID` and `clientSecret` immediately—they cannot be retrieved again.

Update your `.env` file with the `access_token`:

```env
AFFORDMED_API_TOKEN=<your_access_token_here>
AFFORDMED_LOG_TOKEN=<your_access_token_here>
```

### 4. Logging Middleware

The logging middleware (`logging_middleware/index.js`) is integrated throughout the application. It provides:

- **Reusable log function**: `Log(stack, level, package, message)`
- **Allowed values**:
  - `stack`: `'backend'` or `'frontend'`
  - `level`: `'debug'` | `'info'` | `'warn'` | `'error'` | `'fatal'`
  - `package`: Backend packages like `'service'`, `'handler'`, `'cron_job'`, `'db'`, `'repository'`, `'controller'`, `'route'`, `'cache'`, `'domain'`, or common packages like `'auth'`, `'config'`, `'middleware'`, `'utils'`
  - `message`: A descriptive string

- **Configuration**: Call `configureLogger({ token })` before logging

- **Error handling**: All log calls are safe; errors are caught and logged separately

### 5. Running the Components

#### Vehicle Maintenance Scheduler

Fetch depot and vehicle data, then solve the knapsack problem to maximize operational impact:

```bash
node vehicle_maintence_scheduler/index.js
```

This will output a JSON schedule showing which vehicles to service at each depot within the mechanic-hour budget.

#### Priority Notification Inbox

Fetch the top 10 unread notifications, prioritized by type (Placement > Result > Event) and recency:

```bash
node notification_app_be/index.js
```

This will output a JSON object with the top notifications sorted by priority.

#### Demo Logging Call

Test the logging middleware:

```bash
npm run log:demo
```

## Logging Integration

The logging middleware is integrated at key points throughout the codebase:

- **notification_app_be**: Logs when fetching notifications, processing them, and finding the top unread items
- **vehicle_maintence_scheduler**: Logs depot planning and error conditions
- **register_and_auth**: Logs registration and authentication flows

All Log calls include descriptive context about what is happening, making it easy to troubleshoot and understand application behavior.

## API Endpoints

All API calls use the protected endpoints provided by the test server:

- `POST /evaluation-service/register` — Register a new candidate
- `POST /evaluation-service/auth` — Authenticate and get access token
- `POST /evaluation-service/logs` — Post application logs
- `GET /evaluation-service/depots` — Fetch depot information
- `GET /evaluation-service/vehicles` — Fetch vehicle maintenance tasks
- `GET /evaluation-service/notifications` — Fetch notifications for a student

All protected endpoints require the `Authorization: Bearer <access_token>` header.

## Design Document

See `notification_system_design.md` for:

- **Stage 1**: REST API design and contract
- **Stage 2**: Database schema and query design
- **Stage 3**: Query optimization and indexing strategy
- **Stage 4**: Performance scaling and caching strategies
- **Stage 5**: Reliable bulk notification delivery
- **Stage 6**: Priority inbox algorithm and implementation

## Testing and Output

All outputs should be captured via API clients like Postman or Insomnia, showing:

- Request body
- Response body
- Response time

Example output structure for each component:

```json
{
  "topNotifications": [
    {
      "ID": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "Type": "Placement",
      "Message": "Company hiring",
      "Timestamp": "2026-05-02T10:00:00Z"
    }
  ]
}
```

## Code Quality

This implementation follows production-grade standards:

- Clear naming conventions and organized folder structure
- Comprehensive logging for debugging and observability
- Error handling and graceful degradation
- Input validation and defensive programming
- Reusable, modular components
- No external dependencies (Node.js built-ins only)

## License

Confidential — Affordmed Technologies Private Limited
