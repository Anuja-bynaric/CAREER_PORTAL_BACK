import 'dotenv/config'; // MUST BE AT TOP
import express from 'express';
import cors from 'cors';
import path from 'path';
import jobApplicationRoute from './src/routes/jobApplicationRoute';
import loginRoute from './src/routes/loginRoute'


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/user', jobApplicationRoute);
app.use('/user', loginRoute);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});