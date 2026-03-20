import express from 'express';
import { scheduleInterview, updateInterviewStatus, getInterviews } from '../controller/interviewController';
import { verifyToken, isHRAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// HR/Admin specific routes
router.post('/schedule', verifyToken, isHRAdmin, scheduleInterview);
router.patch('/:id/status', verifyToken, isHRAdmin, updateInterviewStatus);
router.get('/', verifyToken, isHRAdmin, getInterviews);

export default router;
