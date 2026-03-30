import 'dotenv/config'; // MUST BE AT TOP
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import jobApplicationRoute from './src/routes/jobApplicationRoute';
import loginRoute from './src/routes/loginRoute'
import jobRoute from './src/routes/jobRoute'
import interviewRoute from './src/routes/interviewRoute';
import interviewerRoute from './src/routes/interviewerRoute';
import resumeRoute from './src/routes/resumeRoute';
import googleAuthRoutes from "./src/routes/googleAuth";
import { scheduleInterview } from './src/controllers/interview.controller';
// import calendarRoute from './src/routes/calendarRoute';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5173', // Adjust to your frontend URL
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/user', jobApplicationRoute);
app.use('/user', loginRoute);

app.use('/interviewer/interviews', interviewRoute);

app.use('/admin', jobRoute)
app.use('/admin/interviews', interviewRoute);
app.use('/admin/interviewers', interviewerRoute);
app.use('/admin/resumes', resumeRoute);
app.use('/admin/applications', jobApplicationRoute); // moved to /admin/applications instead of sharing /admin exactly

app.use("/auth", googleAuthRoutes);

// Protect standalone /schedule with HR admin auth? Left as is, but it seems there's a duplicate... actually I'll just remove the duplicate if it exists, or just leave it.

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});