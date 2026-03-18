// server.ts
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import jobApplicationRoute from './src/routes/jobApplicationRoute';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/user',jobApplicationRoute)

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});