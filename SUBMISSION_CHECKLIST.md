# Affordmed Backend Submission Checklist

## Pre-Submission Tasks

This checklist ensures all deliverables are completed correctly before final submission.

### 1. Registration and Setup

- [ ] Run `node register_and_auth.js`
- [ ] Save the `access_token` from the response
- [ ] Create `.env` file with `AFFORDMED_API_TOKEN=<your_token>`
- [ ] Verify environment variables are set correctly

### 2. Logging Middleware (Pre-Test Setup)

- [ ] Logging middleware is implemented in `logging_middleware/index.js`
- [ ] `Log(stack, level, package, message)` function is reusable
- [ ] Logger is integrated into all major code paths:
  - [ ] Vehicle scheduler logs depot planning
  - [ ] Notification system logs API calls and processing
  - [ ] Error handling includes logging
- [ ] Test logging with: `npm run log:demo`
- [ ] Commit: "Implement reusable logging middleware"

### 3. Vehicle Maintenance Scheduler

- [ ] Scheduler fetches depot and vehicle data from protected APIs
- [ ] Knapsack algorithm correctly maximizes impact within time constraints
- [ ] Logging is integrated throughout
- [ ] Run with: `node vehicle_maintence_scheduler/index.js`
- [ ] Capture output screenshot in Postman/Insomnia
- [ ] Verify output shows:
  - Generated timestamp
  - Each depot's schedule
  - Selected tasks with task ID, duration, and impact
  - Total duration and impact
- [ ] Commit: "Implement vehicle maintenance scheduler"

### 4. Notification System Design Document

- [ ] `notification_system_design.md` contains all 6 stages:
  - [ ] **Stage 1**: REST API design with endpoints, contracts, headers, JSON schemas
  - [ ] **Stage 2**: Database schema and example queries
  - [ ] **Stage 3**: Query optimization and index strategy
  - [ ] **Stage 4**: Performance scaling and caching strategies
  - [ ] **Stage 5**: Reliable bulk notification delivery with pseudocode
  - [ ] **Stage 6**: Priority inbox algorithm explanation
- [ ] Commit: "Add notification system design document (Stages 1-5)"

### 5. Priority Inbox Implementation (Stage 6)

- [ ] Priority inbox code in `notification_app_be/index.js`:
  - [ ] Fetches notifications from protected API
  - [ ] Returns top 10 unread notifications
  - [ ] Sorts by priority weight (Placement > Result > Event)
  - [ ] Sorts by recency within same type
  - [ ] Uses min-heap for efficiency
- [ ] Run with: `node notification_app_be/index.js`
- [ ] Capture output screenshot:
  - [ ] Shows top unread notifications
  - [ ] Sorted by priority and recency
  - [ ] Includes ID, Type, Message, Timestamp
- [ ] Commit: "Implement priority inbox with top 10 notifications"

### 6. Screenshots for Submission

Capture these screenshots using Postman or Insomnia:

#### Registration Flow

- [ ] Screenshot: POST to `/register` endpoint
  - Request body with email, roll number, access code
  - Response with `clientID` and `clientSecret`

#### Authentication Flow

- [ ] Screenshot: POST to `/auth` endpoint
  - Request body with credentials
  - Response with `access_token` and `token_type`

#### Logging Middleware Demo

- [ ] Screenshot: Log API call result
  - Request to `/logs` endpoint
  - Response with `logID` and success message

#### Vehicle Scheduler Output

- [ ] Screenshot: Scheduler output showing schedule
  - JSON output with depot planning
  - Selected tasks with impact maximized

#### Priority Inbox Output

- [ ] Screenshot: Top 10 notifications
  - JSON output showing priority-sorted notifications
  - Placement notifications first, then Result, then Event
  - Recent timestamps within same type

### 7. Code Quality Checks

- [ ] No plagiarism (code is original)
- [ ] No console.log statements (use logging middleware instead)
- [ ] Proper error handling throughout
- [ ] Meaningful variable and function names
- [ ] Comments for complex logic
- [ ] No hardcoded credentials or sensitive data
- [ ] .env file is in .gitignore
- [ ] node_modules is in .gitignore

### 8. GitHub Repository

- [ ] Repository name: Your roll number only (e.g., `RA2311003030310`)
- [ ] No mention of "Affordmed" or your name in repo name or README
- [ ] Repository is public
- [ ] Commit messages do not reveal company name
- [ ] All code is pushed to main branch
- [ ] Frequent, logical commits (not a single commit)

### 9. Final Verification

- [ ] All files are correctly placed:
  - [ ] `logging_middleware/` folder
  - [ ] `vehicle_maintence_scheduler/` folder
  - [ ] `notification_app_be/` folder
  - [ ] `notification_system_design.md`
  - [ ] `.gitignore`
  - [ ] `package.json`
  - [ ] `README.md`
- [ ] All npm scripts work:
  - [ ] `npm run setup`
  - [ ] `npm run scheduler`
  - [ ] `npm run priority`
  - [ ] `npm run log:demo`
- [ ] Environment variables are configured

### 10. Google Form Submission

- [ ] Fill out the registration form ONLY after:
  - [ ] Logging middleware is fully integrated
  - [ ] All code is committed and pushed to GitHub
  - [ ] All screenshots are captured
- [ ] Form fields:
  - [ ] Email: `av4125@srmist.edu.in`
  - [ ] Roll Number: `RA2311003030310`
  - [ ] GitHub Username: Your GitHub username
  - [ ] GitHub Repository Link: Full URL to your repo
  - [ ] Select track: Backend
- [ ] Submit before deadline: **1:00 PM**

## Notes

- **3-hour time limit** from when you start coding
- **Do NOT wait until the end to commit** — push regularly at milestones
- **Logging is mandatory** — every significant code path must log
- **Original code only** — plagiarism leads to immediate rejection
- **No user registration/login** — assume users are pre-authorized
- **Test server credentials** — save `clientID` and `clientSecret` immediately

## Troubleshooting

| Issue                            | Solution                                                       |
| -------------------------------- | -------------------------------------------------------------- |
| "Token not configured"           | Ensure `.env` file has `AFFORDMED_API_TOKEN` set               |
| "Request failed with status 401" | Token has expired or is invalid; re-run `register_and_auth.js` |
| "No depots returned"             | Verify API token is correct and server is accessible           |
| "Plagiarism detected"            | Ensure all code is your own original work                      |
| "Missing logging calls"          | Check all functions have appropriate Log calls                 |

## Support

Refer to:

- `README.md` — Setup and running instructions
- `notification_system_design.md` — Design details and rationale
- `logging_middleware/index.js` — Logging API documentation
