# Stage 1

## Core Actions

The notification platform should support these actions:

1. Fetch the latest notifications for the signed-in student.
2. Fetch only unread notifications.
3. Mark one notification as read.
4. Mark all notifications as read.
5. Create and broadcast a notification to one student or many students.
6. Stream new notifications in real time.

## REST API Design

### List notifications

`GET /api/v1/notifications?cursor=...&limit=20&unreadOnly=true`

Request headers:

```http
Authorization: Bearer <access_token>
Accept: application/json
```

Response:

```json
{
  "data": [
    {
      "id": "notif_123",
      "type": "Placement",
      "title": "Company drive announced",
      "message": "Drive opens tomorrow at 10 AM",
      "isRead": false,
      "createdAt": "2026-05-02T09:30:00Z"
    }
  ],
  "nextCursor": "2026-05-02T09:30:00Z:notif_123"
}
```

### Get one notification

`GET /api/v1/notifications/{notificationId}`

### Mark as read

`PATCH /api/v1/notifications/{notificationId}/read`

Request:

```json
{
  "read": true
}
```

### Mark all as read

`POST /api/v1/notifications/read-all`

### Create notification

`POST /api/v1/notifications`

Request:

```json
{
  "type": "Result",
  "title": "Mid-sem results out",
  "message": "Results are now available in the portal",
  "audience": {
    "mode": "all_students"
  }
}
```

### Real-time updates

`GET /api/v1/notifications/stream`

Use Server-Sent Events for one-way push to the browser. WebSocket can be added if bi-directional presence or acknowledgements are required.

```http
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

## Suggested JSON Schema

```json
{
  "id": "string",
  "studentId": "string",
  "type": "Event | Result | Placement",
  "title": "string",
  "message": "string",
  "isRead": "boolean",
  "priority": "number",
  "createdAt": "string",
  "updatedAt": "string"
}
```

# Stage 2

## Storage Choice

I would use PostgreSQL because the notification domain needs transactional writes, reliable filtering, stable ordering, and strong indexing for unread feeds. The schema is naturally relational: students, notifications, delivery state, and audit events all belong together.

## Schema

```sql
CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  roll_no VARCHAR(40) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Event', 'Result', 'Placement')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL
);

CREATE TABLE notification_recipients (
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ NULL,
  delivered_at TIMESTAMPTZ NULL,
  PRIMARY KEY (notification_id, student_id)
);
```

## Scaling Problems And Fixes

As the data grows, hot reads will cluster around unread feeds and recent notifications. The main fixes are composite indexes, cursor pagination, partitioning by time, and background workers for delivery. For very large fan-out workloads, I would also denormalize a per-student inbox view and cache the first page.

## Example Queries

```sql
SELECT n.id, n.type, n.title, n.message, nr.is_read, n.created_at
FROM notification_recipients nr
JOIN notifications n ON n.id = nr.notification_id
WHERE nr.student_id = $1 AND nr.is_read = false
ORDER BY n.created_at DESC, n.id DESC
LIMIT $2;

SELECT n.id, n.type, n.title, n.message
FROM notifications n
JOIN notification_recipients nr ON nr.notification_id = n.id
WHERE nr.student_id = $1 AND nr.is_read = false AND n.created_at >= now() - interval '7 days';
```

# Stage 3

The slow query is logically correct, but it is not efficient at scale:

```sql
SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt DESC;
```

It becomes slow because the database must scan too many rows, sort a large result set, and fetch unnecessary columns with `SELECT *`. I would replace it with a narrow projection and a composite index that matches the filter and sort order.

Recommended index:

```sql
CREATE INDEX idx_notifications_student_read_created
ON notification_recipients (student_id, is_read, notification_id);
```

If unread rows are queried very often, a partial index is even better:

```sql
CREATE INDEX idx_notifications_unread_by_student
ON notification_recipients (student_id, notification_id)
WHERE is_read = false;
```

Adding an index on every column is not effective. It increases storage, slows inserts and updates, and makes the planner work harder. Indexes should match real access patterns, not be added indiscriminately.

Query for all students who got a placement notification in the last 7 days:

```sql
SELECT DISTINCT nr.student_id
FROM notification_recipients nr
JOIN notifications n ON n.id = nr.notification_id
WHERE n.type = 'Placement'
  AND n.created_at >= now() - interval '7 days';
```

# Stage 4

If notifications are fetched on every page load, the database will get overwhelmed. I would reduce pressure with a layered approach:

1. Cache the first unread page per student in Redis with a short TTL.
2. Use cursor-based pagination instead of offset pagination.
3. Push new notification events through SSE or WebSocket so the UI does not poll constantly.
4. Keep a denormalized inbox table or materialized view for the common unread list.
5. Archive old notifications into cold storage or monthly partitions.

Tradeoffs:

- Caching improves speed but adds invalidation complexity.
- Cursor pagination is faster and stable, but it is less convenient than page numbers.
- Push-based delivery is responsive, but it needs connection management and retry logic.
- Denormalized inboxes are fast to read, but writes become more expensive.
- Partitioning reduces scan cost, but it makes schema maintenance more involved.

# Stage 5

The original bulk notification pseudocode is risky because it mixes email delivery, database writes, and in-app push in one synchronous loop. It is slow, hard to retry, and can leave the system in a half-failed state.

What should change:

1. Write the notification intent once.
2. Put delivery jobs on a queue.
3. Let separate workers send email and in-app updates.
4. Retry failed deliveries with backoff.
5. Record idempotency keys so duplicate retries do not duplicate messages.

Saving to the database and sending email should not happen as one distributed transaction. Persisting the intent first is safer, then delivery workers can process it asynchronously.

Revised pseudocode:

```text
function notify_all(student_ids, message):
    notification_id = insert_notification(message)
    for student_id in student_ids:
        insert_recipient(notification_id, student_id)
        enqueue_job({ notification_id, student_id, channels: ['email', 'in_app'] })

worker process(job):
    if job already completed:
        return
    send_email(job.student_id, job.notification_id)
    push_to_app(job.student_id, job.notification_id)
    mark_job_completed(job)
```

# Stage 6

Priority inbox should always return the top `n` unread notifications using a weight-first, recency-second ordering. I would use a min-heap of size `n` so the system only keeps the best results in memory while scanning a larger stream.

Priority order:

1. Placement
2. Result
3. Event

Within the same type, newer notifications come first.

Complexity:

- Time: `O(m log n)` for `m` notifications and top `n`
- Space: `O(n)`

This is well suited for streaming updates because each new notification can be compared against the current heap root and inserted only if it belongs in the top `n`.
