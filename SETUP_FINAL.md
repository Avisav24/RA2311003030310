# Final Setup Instructions

Your backend code is now ready on GitHub with all required components. To complete the final integration with the test server, follow these steps:

## Step 1: Obtain Your Credentials

If you don't have your registration credentials yet, you need to:

1. **Check your email** (av4125@srmist.edu.in) for registration confirmation
2. **If you already registered**, look for the email containing:
   - `clientID`: Your unique client identifier
   - `clientSecret`: Your client secret key (save this immediately, cannot be retrieved)

## Step 2: Authenticate with the Test Server

Update the `authenticate.js` file with your credentials:

```javascript
const AUTH_CREDENTIALS = {
  // ... (email, rollNo, accessCode stay the same)
  clientID: 'YOUR_CLIENT_ID_HERE',     // <- Replace with your clientID
  clientSecret: 'YOUR_CLIENT_SECRET_HERE'  // <- Replace with your clientSecret
};
```

Then run:

```bash
node authenticate.js
```

This will output your access token. Copy it.

## Step 3: Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your token to `.env`:

```env
AFFORDMED_API_TOKEN=<paste_your_token_here>
AFFORDMED_LOG_TOKEN=<paste_your_token_here>
```

## Step 4: Test All Components

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

## Step 5: Capture Screenshots

Use Postman or Insomnia to capture these API calls (they show automatically when you run the scripts):

1. **Logging Test**: Shows successful log API call
2. **Scheduler Output**: JSON with vehicle maintenance plan
3. **Priority Inbox Output**: JSON with top 10 notifications

Each screenshot should display:
- Request body
- Response body
- Response time

## Step 6: Make Final Commit

Once everything works, make a final commit:

```bash
git add -A
git commit -m "Complete backend implementation with API integration"
git push origin main
```

## Credentials Location

If you previously registered and can't find your credentials:

1. Check the test server confirmation email
2. Or contact the evaluation team with your:
   - Email: av4125@srmist.edu.in
   - Roll Number: RA2311003030310
   - Access Code: QkbpxH

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token is invalid or expired; re-authenticate |
| 409 Conflict | Account already registered; use existing credentials |
| No depots/notifications | Token is valid but API is temporarily unavailable |
| Script hangs | Check network connectivity to 20.207.122.201 |

## GitHub Form Submission

After completing all steps, fill the Google Form:
- Email: av4125@srmist.edu.in
- Roll Number: RA2311003030310
- GitHub Username: Avisav24
- GitHub Repository: https://github.com/Avisav24/RA2311003030310
- Track: Backend

**Deadline: 1:00 PM**

All code is production-ready and awaiting only the API token to complete end-to-end testing.
