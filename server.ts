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
import googleAuthRoutes from "./src/routes/googleAuth";
import { scheduleInterview } from './src/controller/interviewController';
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
app.use('/admin', jobApplicationRoute);
app.use('/admin', jobRoute)
app.use('/admin/interviews', interviewRoute);
app.use('/admin/interviewers', interviewerRoute);

app.use("/auth", googleAuthRoutes);

app.post("/schedule", scheduleInterview);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});