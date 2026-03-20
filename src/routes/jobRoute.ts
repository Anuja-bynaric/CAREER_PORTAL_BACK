import express from 'express';
import { getAllJobs,searchJobs, createJob, updateJob, deleteJob } from '../controller/jobController';
import { verifyToken, isHRAdmin } from '../middleware/authMiddleware';

const router = express.Router();


router.get('/all/jobs', getAllJobs);
router.get('/search', searchJobs);
router.post('/create/jobs', verifyToken, isHRAdmin, createJob);
router.put('/update/jobs/:id', verifyToken, isHRAdmin, updateJob);
router.delete('/delete/jobs/:id', verifyToken, isHRAdmin, deleteJob);

export default router;