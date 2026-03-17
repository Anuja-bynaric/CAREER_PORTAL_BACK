import { Router } from "express";
import { createApplication } from '../controller/jobApplication';

const router = Router();

// Endpoint: POST /user/applyJob
router.post('/applyJob', createApplication);

export default router;