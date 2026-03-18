import { Router } from "express";
import { createApplication } from '../controller/jobApplication';
import { applyJob, setPassword } from "../controller/user.controller";

const router = Router();

// Endpoint: POST /user/applyJob
router.post('/applyJob', createApplication);
router.post('/apply', applyJob);
router.post('/set-password', setPassword);

export default router;