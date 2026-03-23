# Interview Scheduling API - Postman Collection

## Overview

This Postman collection provides comprehensive testing for the Interview Scheduling API with Google Calendar integration. The collection includes authentication, interview scheduling, and management endpoints.

## Prerequisites

1. **Running Backend Server**: Ensure the backend is running on `http://localhost:5000`
2. **Database Setup**: Job applications and users should exist in the database
3. **Google Calendar Setup**: Environment variables configured for Google Calendar API
4. **Postman**: Import the `Interview_Scheduling_Postman_Collection.json` file

## Setup Instructions

### 1. Import Collection
1. Open Postman
2. Click "Import" button
3. Select "File" tab
4. Choose `Interview_Scheduling_Postman_Collection.json`
5. Click "Import"

### 2. Configure Environment
Create a new environment in Postman with these variables:
- `base_url`: `http://localhost:5000` (or your server URL)
- `auth_token`: (will be set automatically after login)
- `interview_id`: (will be set automatically after scheduling)

### 3. Test Flow

#### Step 1: Authentication
1. Run "Login as HR Admin" request
2. This sets the `auth_token` variable automatically

#### Step 2: Get Reference Data
1. Run "Get All Job Applications" to find valid `jobApplicationId`
2. Run "Get Candidates by Job ID" to see candidates for a specific job
3. Run "Get All Users" to find valid `interviewerId`

#### Step 3: Schedule Interviews
Choose one of the scheduling requests:
- **Online Interview**: Automatic Google Meet link generation
- **Face-to-Face Interview**: Physical location scheduling
- **Calendly Interview**: Self-scheduling via Calendly

#### Step 4: Manage Interviews
- Update interview status
- Get interview details
- Cancel interviews
- View all interviews

#### Step 5: Verify Google Calendar Scheduling
1. After running "Schedule Online Interview (Google Meet)", confirm response status is `201`.
2. In the response JSON, ensure `data.meetingLink` is present and starts with `https://meet.google.com/`.
3. (Optional) Visit your Google Calendar and confirm the event exists at the requested `scheduledAt` date/time, with the same title and email attendees.
4. If you don’t see the event in your calendar, re-check environment variables:
   - `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_CALENDAR_ID`
   - `GOOGLE_PROJECT_ID`
5. If API response fails, copy the error message and troubleshoot with server logs; common issue is missing service account calendar permission.

## Request Examples

### Schedule Online Interview
```json
{
  "jobApplicationId": 1,
  "interviewerId": 2,
  "interviewType": "Online",
  "scheduledAt": "2024-12-25T10:00:00Z",
  "durationMinutes": 60,
  "notes": "Technical interview focusing on React and Node.js"
}
```

### Update Interview Status
```json
{
  "status": "completed",
  "remarks": "Candidate performed well, recommended for next round"
}
```

### Cancel Interview
```json
{
  "cancellationReason": "Candidate requested rescheduling"
}
```

## Environment Variables

The collection uses these variables:
- `{{base_url}}`: API base URL
- `{{auth_token}}`: JWT authentication token
- `{{interview_id}}`: ID of created interview

## Error Handling

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

## Google Calendar Integration

For online interviews, ensure these environment variables are set:
```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SERVICE_ACCOUNT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_CALENDAR_ID="your-calendar-id@group.calendar.google.com"
GOOGLE_PROJECT_ID="your-project-id"
```

## Troubleshooting

### Authentication Issues
- Ensure HR admin user exists in database
- Check JWT token expiration
- Verify middleware configuration

### Calendar Integration
- Check Google Cloud credentials
- Verify calendar permissions
- Check API quotas

### Database Issues
- Ensure foreign key constraints are satisfied
- Check data types match schema
- Verify table relationships

## Collection Structure

```
Career Portal - Interview Scheduling API
├── Authentication
│   └── Login as HR Admin
├── Job Applications
│   ├── Get All Job Applications
│   └── Get Candidates by Job ID
├── Users
│   └── Get All Users
└── Interview Scheduling
    ├── Schedule Online Interview (Google Meet)
    ├── Schedule Face-to-Face Interview
    ├── Schedule Calendly Interview
    ├── Update Interview Status
    ├── Get All Interviews
    ├── Get Interview by ID
    ├── Get Interviews by Application
    └── Cancel Interview
```

## Support

For issues with the API or collection:
1. Check server logs for detailed error messages
2. Verify database state and relationships
3. Test individual endpoints in sequence
4. Check environment variable configuration