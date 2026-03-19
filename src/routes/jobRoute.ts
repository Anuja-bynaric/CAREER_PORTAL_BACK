import express from 'express';
import { getAllJobs,searchJobs } from '../controller/jobController';

const router = express.Router();


router.get('/all', getAllJobs);
router.get('/search', searchJobs);
export default router;