# Interview Scheduling System

## Overview

The Interview Scheduling System provides a comprehensive solution for managing interview processes with integrated calendar functionality. It supports three types of interviews: Online (Google Meet), Face-to-Face, and Calendly-based scheduling.

## Features

- **Multiple Interview Types**: Online, Face-to-Face, and Calendly
- **Google Calendar Integration**: Automatic event creation with Google Meet links
- **Email Notifications**: Automated emails to candidates and interviewers
- **Nylas Integration**: Alternative calendar provider for free tier
- **Calendly Integration**: Self-scheduling for candidates
- **Status Tracking**: Monitor interview progress (scheduled, completed, cancelled)

## API Endpoints

### Schedule Interview
**Endpoint:** `POST /admin/interviews/schedule`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "jobApplicationId": 1,
  "interviewerId": 2,
  "interviewType": "Online",
  "scheduledAt": "2024-12-20T10:00:00Z",
  "durationMinutes": 60,
  "notes": "Technical interview focusing on React and Node.js",
  "location": "Conference Room A" // Required only for Face to Face
}
```

**Parameters:**
- `jobApplicationId` (required): ID of the job application
- `interviewerId` (required): ID of the interviewer
- `interviewType` (required): "Online", "Face to Face", or "Calendly"
- `scheduledAt` (required for Online/Face-to-Face): ISO 8601 datetime string
- `durationMinutes` (optional): Interview duration in minutes (default: 60)
- `notes` (optional): Additional notes for the interview
- `location` (required for Face-to-Face): Physical location of the interview
- `calendlyEventUrl` (optional for Calendly): Direct Calendly event URL
- `calendlyEventTypeUrl` (optional for Calendly): Calendly event type URL

### Get Candidates by Job ID
**Endpoint:** `GET /user/job/:jobId/candidates`

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `jobId` (required): The job ID (e.g., "job_1234567890")

**Response:**
```json
{
  "success": true,
  "message": "Found 3 candidate(s) for job job_1234567890",
  "count": 3,
  "data": [
    {
      "id": 1,
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "+1234567890",
      "resumeUrl": "uploads/resumes/resume_123.pdf",
      "consentGiven": true,
      "appliedAt": "2024-12-20T08:00:00.000Z",
      "status": "pending",
      "notes": null,
      "jobId": "job_1234567890"
    }
  ]
}
```

**Error Response (No candidates found):**
```json
{
  "success": false,
  "message": "No candidates found for this job.",
  "data": []
}
```

### Update Interview Status
**Endpoint:** `PATCH /admin/interviews/:id/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "completed",
  "remarks": "Candidate performed well, recommended for next round"
}
```

**Valid Statuses:** `scheduled`, `completed`, `cancelled`

### Get All Interviews
**Endpoint:** `GET /admin/interviews/`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "jobApplicationId": 1,
      "interviewerId": 2,
      "scheduledAt": "2024-12-20T10:00:00.000Z",
      "interviewType": "Online",
      "meetingLink": "https://meet.google.com/abc-defg-hij",
      "status": "scheduled",
      "notes": "Technical interview",
      "createdAt": "2024-12-19T08:00:00.000Z"
    }
  ]
}
```

### Get Interview by ID
**Endpoint:** `GET /admin/interviews/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "jobApplicationId": 1,
    "interviewerId": 2,
    "scheduledAt": "2024-12-20T10:00:00.000Z",
    "interviewType": "Online",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "status": "scheduled",
    "notes": "Technical interview",
    "createdAt": "2024-12-19T08:00:00.000Z"
  }
}
```

### Get Interviews by Application
**Endpoint:** `GET /admin/interviews/application/:applicationId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "jobApplicationId": 1,
      "scheduledAt": "2024-12-20T10:00:00.000Z",
      "interviewType": "Online",
      "status": "completed"
    },
    {
      "id": 3,
      "jobApplicationId": 1,
      "scheduledAt": "2024-12-25T14:00:00.000Z",
      "interviewType": "Face to Face",
      "status": "scheduled"
    }
  ]
}
```

### Cancel Interview
**Endpoint:** `DELETE /admin/interviews/:id/cancel`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "cancellationReason": "Candidate unavailable due to personal reasons"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interview cancelled successfully",
  "data": {
    "id": 1,
    "status": "cancelled",
    "notes": "CANCELLED: Candidate unavailable due to personal reasons"
  }
}
```

## Interview Types

### 1. Online Interviews
- **Automatic Google Meet Creation**: System generates Google Meet links
- **Calendar Invitations**: Sent to both candidate and interviewer
- **Fallback Support**: Uses Nylas if Google Calendar fails
- **Email Notifications**: Includes meeting link and calendar details

### 2. Face-to-Face Interviews
- **Location-Based**: Requires physical location specification
- **Email Notifications**: Contains date, time, and location details
- **Calendar Integration**: Can be added to personal calendars manually

### 3. Calendly Interviews
- **Self-Scheduling**: Candidates choose their preferred time slots
- **Calendly Integration**: Uses Calendly's scheduling system
- **Flexible Booking**: Interviewers set availability through Calendly

## Google Calendar Setup

### Prerequisites
1. Google Cloud Project with Calendar API enabled
2. Service Account with Calendar permissions
3. Calendar ID for event creation

### Environment Variables
```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SERVICE_ACCOUNT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_CALENDAR_ID="your-calendar-id@group.calendar.google.com"
GOOGLE_PROJECT_ID="your-project-id"
GOOGLE_PRIVATE_KEY_ID="your-private-key-id"
GOOGLE_CLIENT_ID="your-client-id"
```

### Required Permissions
- `https://www.googleapis.com/auth/calendar`
- Service account must have write access to the specified calendar

## Email Templates

The system includes comprehensive email templates for all interview types:

### Online Interviews
- **Candidate**: Meeting link, date/time, calendar invitation info
- **Interviewer**: Candidate details, meeting link, calendar invitation

### Face-to-Face Interviews
- **Candidate**: Date, time, location, preparation instructions
- **Interviewer**: Candidate info, date, time, location details

### Calendly Interviews
- **Candidate**: Calendly booking link, interviewer info
- **Interviewer**: Booking link, expected schedule placeholder

## Error Handling

### Common Error Scenarios
1. **Missing Google Credentials**: Returns 500 with setup instructions
2. **Invalid Interview Type**: Returns 400 with valid options
3. **Missing Required Fields**: Returns 400 with field requirements
4. **Non-existent Application/Interviewer**: Returns 404
5. **Calendar API Failures**: Falls back to alternative providers

### Fallback Mechanisms
- Google Calendar → Nylas → Manual scheduling
- Email failures are logged but don't block interview creation
- Invalid data is validated before processing

## Database Schema

### Interviews Table
```sql
CREATE TABLE interviews (
  id SERIAL PRIMARY KEY,
  job_application_id INTEGER REFERENCES job_applications(id) ON DELETE CASCADE,
  interviewer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP NOT NULL,
  interview_type VARCHAR(20) DEFAULT 'Online' NOT NULL,
  location VARCHAR(500),
  meeting_link TEXT,
  status VARCHAR(20) DEFAULT 'scheduled' NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

- **Authentication Required**: All endpoints require valid JWT tokens
- **HR/Admin Only**: Interview management restricted to HR administrators
- **Data Validation**: All inputs validated before processing
- **SQL Injection Protection**: Parameterized queries used throughout

## Monitoring and Logging

- **Console Logging**: All calendar operations logged
- **Error Tracking**: Failed operations recorded with details
- **Email Status**: Send operations logged for debugging
- **API Responses**: Structured success/error responses

## Future Enhancements

- **Zoom Integration**: Additional video conferencing options
- **SMS Notifications**: Text message reminders
- **Interview Feedback**: Built-in rating and feedback system
- **Recurring Interviews**: Support for multi-round interview series
- **Time Zone Support**: Automatic timezone conversion
- **Calendar Sync**: Bidirectional calendar synchronization