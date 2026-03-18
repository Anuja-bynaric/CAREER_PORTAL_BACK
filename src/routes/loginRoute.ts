import express from 'express';
import { loginUser } from '../controller/loginController';
import { finalizeApplication } from '../controller/jobApplication';

const router = express.Router();

// Existing route
router.post('/finalize-application', finalizeApplication);

// NEW: Login route
router.post('/login', loginUser);

export default router;