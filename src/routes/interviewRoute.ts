import express from 'express';
import { scheduleInterview, updateInterviewStatus, rescheduleInterview, getInterviews, getInterviewById, getInterviewsByApplication, cancelInterview, submitFeedback } from '../controllers/interview.controller';
import { verifyToken, isHRAdmin, isInterviewer } from '../middleware/authMiddleware';

const router = express.Router();

// HR/Admin specific routes for modifying
router.post('/schedule', verifyToken, isHRAdmin, scheduleInterview);
router.patch('/:id/status', verifyToken, isHRAdmin, updateInterviewStatus);
router.patch('/:id/reschedule', verifyToken, isHRAdmin, rescheduleInterview);
router.delete('/:id/cancel', verifyToken, isHRAdmin, cancelInterview);

// Interviewer & HR routes for reading/feedback
router.get('/', verifyToken, isInterviewer, getInterviews);
router.get('/:id', verifyToken, isInterviewer, getInterviewById);
router.get('/application/:applicationId', verifyToken, isInterviewer, getInterviewsByApplication);
router.patch('/:id/feedback', verifyToken, isInterviewer, submitFeedback);

export default router;
