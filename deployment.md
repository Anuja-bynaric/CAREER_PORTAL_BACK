# Deployment Guide: Render.com

Follow these steps to deploy your backend to Render.

## 1. Prepare Your GitHub Repository
Ensure all your current changes are pushed to your GitHub repository:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin your-branch-name
```

## 2. Create a New Web Service on Render
1.  Log in to [Render Dashboard](https://dashboard.render.com/).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub repository.
4.  Select the repository for this project.

## 3. Configure Service Settings
Fill in the following details in the Render setup page:

-   **Name**: `career-portal-backend` (or your choice)
-   **Environment**: `Node`
-   **Build Command**: `npm install`
-   **Start Command**: `npm start`

## 4. Environment Variables
Click the **Environment** tab and add the following variables. **Do not skip this step!**

| Variable | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Your production database connection string |
| `JWT_SECRET` | `your-long-random-secret` | Secret key for JWT token signing |
| `FRONTEND_URL` | `https://your-frontend.onrender.com` | Your deployed frontend URL |
| `EMAIL_USER` | `your-email@gmail.com` | SMTP email for notifications |
| `EMAIL_PASS` | `your-app-password` | SMTP password (use App Passwords for Gmail) |
| `NODE_ENV` | `production` | Set to production |

> [!IMPORTANT]
> If you are using Google OAuth, make sure to add your `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URL` to the environment variables as well.

## 5. Deployment
1.  Click **Create Web Service**.
2.  Render will pull your code, install dependencies, and start the server.
3.  Once the status turns **Live**, your backend is ready!

---

### Common Issues
- **CORS Errors**: Ensure `FRONTEND_URL` in Render matches your frontend's actual URL exactly (no trailing slash).
- **Database Connection**: Ensure your database allows connections from Render (White-list `0.0.0.0/0` if using a service like Supabase or Neon).
