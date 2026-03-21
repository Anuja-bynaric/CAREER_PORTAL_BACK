import express from 'express';
import { getAllJobs,searchJobs, createJob, updateJob, deleteJob, getJobById } from '../controller/jobController';
import { verifyToken, isHRAdmin } from '../middleware/authMiddleware';

const router = express.Router();


router.get('/all/jobs', getAllJobs);
router.get('/search', searchJobs);
router.get('/jobs/:jobId', getJobById);
router.post('/create/jobs', verifyToken, isHRAdmin, createJob);

router.put('/update/jobs/:jobId', verifyToken, isHRAdmin, updateJob);
router.delete('/delete/jobs/:jobId', verifyToken, isHRAdmin, deleteJob);

export default router;