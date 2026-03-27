import express from 'express';
import { scheduleInterview, updateInterviewStatus, rescheduleInterview, getInterviews, getInterviewById, getInterviewsByApplication, cancelInterview } from '../controllers/interview.controller';
import { verifyToken, isHRAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// HR/Admin specific routes
router.post('/schedule', verifyToken, isHRAdmin, scheduleInterview);
router.patch('/:id/status', verifyToken, isHRAdmin, updateInterviewStatus);
router.patch('/:id/reschedule', verifyToken, isHRAdmin, rescheduleInterview);
router.delete('/:id/cancel', verifyToken, isHRAdmin, cancelInterview);
router.get('/', verifyToken, isHRAdmin, getInterviews);
router.get('/:id', verifyToken, isHRAdmin, getInterviewById);
router.get('/application/:applicationId', verifyToken, isHRAdmin, getInterviewsByApplication);

export default router;
