# Final Setup Instructions

Your backend code is now ready on GitHub with all required components. To complete the final integration with the test server, follow these steps:

## Step 1: Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your access token to `.env`:

```env
AFFORDMED_API_TOKEN=<paste_your_access_token_here>
AFFORDMED_LOG_TOKEN=<paste_your_access_token_here>
```

## Step 2: Verify Token and Test All Components

Run the verification script:

```bash
node register_and_auth.js
```

This should show a protected API response if the token is valid.

## Step 3: Test All Components

### Test Logging Middleware

```bash
npm run log:demo
```

### Test Vehicle Scheduler (with real depot/vehicle data)

```bash
npm run scheduler
```

Expected output: JSON schedule with depot IDs and selected maintenance tasks

### Test Priority Inbox (with real notifications)

```bash
npm run priority
```

Expected output: Top 10 unread notifications sorted by priority

## Step 4: Capture Screenshots

Use Postman or Insomnia to capture these API calls (they show automatically when you run the scripts):

1. **Logging Test**: Shows successful log API call
2. **Scheduler Output**: JSON with vehicle maintenance plan
3. **Priority Inbox Output**: JSON with top 10 notifications

Each screenshot should display:

- Request body
- Response body
- Response time

## Step 5: Make Final Commit

Once everything works, make a final commit:

```bash
git add -A
git commit -m "Complete backend implementation with API integration"
git push origin main
```

## Troubleshooting

| Issue                   | Solution                                          |
| ----------------------- | ------------------------------------------------- |
| 401 Unauthorized        | Token is invalid or expired; re-authenticate      |
| No depots/notifications | Token is valid but API is temporarily unavailable |
| Script hangs            | Check network connectivity to 20.207.122.201      |

## GitHub Form Submission

After completing all steps, fill the Google Form:

- Email: [av4125@srmist.edu.in](mailto:av4125@srmist.edu.in)
- Roll Number: RA2311003030310
- GitHub Username: Avisav24
- GitHub Repository: [github.com/Avisav24/RA2311003030310](https://github.com/Avisav24/RA2311003030310)
- Track: Backend

**Deadline: 1:00 PM**

All code is production-ready and awaiting only the API token to complete end-to-end testing.
