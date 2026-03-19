import { Router } from "express";
import { createApplication, downloadResume, finalizeApplication } from '../controller/jobApplication';
import { upload } from '../../config/multer';

const router = Router();


router.post('/applyJob', upload.single('resume'), createApplication);


router.post('/finalize-application', finalizeApplication);

router.get('/resume/:filename', downloadResume);

export default router;