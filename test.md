# Backend API Testing Guide (Postman)

This guide provides step-by-step instructions and JSON payloads to test the newly added HR, Candidate, and Interviewer roles, along with the Job and Interview Management endpoints.

## 0. Initial Setup: Create HR/Admin User (One-time)
To set up the initial HR or Admin account, use this endpoint. The system strictly allows only one user with the `hr` or `admin` role to exist.

**Endpoint:** `POST /user/create-admin`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "name": "HR Manager",
  "email": "hr@yourcompany.com",
  "password": "yourpassword",
  "phoneNumber": "9876543210",
  "role": "hr"
}
```
**Response:** You will receive a success message and the user details (including `phoneNumber`). If an HR or Admin already exists, you will receive an error.

---

## 1. Authentication (Login)
To access the HR/Admin protected routes, you must first log in with a user whose role is `hr` or `admin`.

**Endpoint:** `POST /user/login` (or your existing login endpoint)
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "email": "hr@yourcompany.com",
  "password": "yourpassword"
}
```
**Response:** You will receive a `token`. Copy this token.

---

## 2. Setting up Authorization in Postman
For all subsequent completely HR-restricted endpoints, go to the **Authorization** tab in Postman:
1. Select **Type**: `Bearer Token`
2. Paste the `token` you received from the login response into the **Token** field.

---

## 3. Job Management (HR Only)

### Create Job Opening
**Endpoint:** `POST /admin/create/jobs/`  *(Based on `server.ts` routing `app.use('/admin', jobRoute)`)*
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
**Body:**
```json
{
  "title": "Senior Frontend Developer",
  "location": "Remote",
  "experience": "5+ Years",
  "jobType": "Full-time",
  "category": "Engineering",
  "description": "We are looking for a Senior Frontend dev to lead our UI team.",
  "requirements": ["React", "TypeScript", "TailwindCSS"],
  "responsibilities": ["Lead frontend architecture", "Mentor junior devs"],
  "about": "We are a fast-growing startup."
}
```

### Update Job Opening
**Endpoint:** `PUT /admin/update/jobs/:id` *(Replace `:id` with a valid `job_openings.id`)*
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
**Body:**
```json
{
  "title": "Lead Frontend Developer",
  "experience": "7+ Years"
}
```

### Delete Job Opening
**Endpoint:** `DELETE /admin/delete/jobs/:id` *(Replace `:id` with a valid `job_openings.id`)*
**Headers:** `Authorization: Bearer <token>`
**Response:** `200 OK` with a success message.

### Get All Jobs
**Endpoint:** `GET /admin/all/jobs`
**Headers:** `Authorization: Bearer <token>` *(Optional due to route, but good practice)*
**Response:** A list of all job postings.

---

## 4. Candidate Application Management (HR Only)

### Update Application Status (Shortlist / Reject / Hired) /==Rounds
**Endpoint:** `PATCH /user/:id/status` *(Replace `:id` with a valid `jobApplication.id`)*
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
**Body:**
```json
{
  "status": "shortlisted",
  "notes": "Candidate has excellent React skills, moving to technical interview."
}
```
*Note: Valid statuses are `pending`, `shortlisted`, `rejected`, `hired`.*

---

## 5. Interviewer Management (HR/Admin Only)

### Create Interviewer
**Endpoint:** `POST /admin/interviewers`
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@company.com",
  "password": "securepassword123",
  "phoneNumber": "9876543210",
  "role": "interviewer"
}
```

### Get All Interviewers
**Endpoint:** `GET /admin/interviewers`
**Headers:** `Authorization: Bearer <token>`
**Response:** Returns a list of all users with the `interviewer` role.

### Update Interviewer
**Endpoint:** `PUT /admin/interviewers/:id` *(Replace `:id` with Interviewer's User ID)*
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
**Body:**
```json
{
  "name": "Jane Smith Doe",
  "email": "jane.smith@company.com"
}
```

### Delete Interviewer
**Endpoint:** `DELETE /admin/interviewers/:id` *(Replace `:id` with Interviewer's User ID)*
**Headers:** `Authorization: Bearer <token>`
**Response:** `200 OK` with a success message.

---

## 6. Interview Management (HR Only)

### Schedule an Interview ++ Face to Face Interview
**Endpoint:** `POST /admin/interviews/schedule`
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
**Body:**
```json
{
  "jobApplicationId": 1,
  "interviewerId": 2, 
  "interviewType":["Online","Face to Face"],
  "scheduledAt": "2024-05-20T10:00:00Z",
  "meetingLink": "https://meet.google.com/xyz-abc-def",
  "notes": "First round technical interview focusing on React and System Design."
}
```
*(Ensure `jobApplicationId` and `interviewerId` exist in your database)*

### Update Interview Status
**Endpoint:** `PATCH /admin/interviews/:id/status` *(Replace `:id` with the `interviews.id`)*
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
**Body:**
```json
{
  "status": "completed",
  "remarks": "Candidate did well, recommended for next round."
}
```
*Note: Valid statuses are `scheduled`, `completed`, `cancelled`.*

### Get All scheduled Interviews
**Endpoint:** `GET /admin/interviews/`
**Headers:** `Authorization: Bearer <token>`
**Response:** Will return a list of all interviews.
