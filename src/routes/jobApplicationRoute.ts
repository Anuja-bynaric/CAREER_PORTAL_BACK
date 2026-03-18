import { Router } from "express";
import { createApplication, downloadResume, finalizeApplication } from '../controller/jobApplication';
import { upload } from '../../config/multer';
import { applyJob, setPassword } from "../controller/user.controller";

const router = Router();

// Endpoint: POST /user/applyJob
router.post('/applyJob', createApplication);
router.post('/apply', applyJob);
router.post('/set-password', setPassword);

// Notice 'resume' here - this must match the key in Postman/Frontend
// This step sends the email
router.post('/applyJob', upload.single('resume'), createApplication);

// This step creates the user and the application after password is set
router.post('/finalize-application', finalizeApplication);

router.get('/resume/:filename', downloadResume);

export default router;