import express from 'express';
import { createInterviewer, getAllInterviewers, updateInterviewer, deleteInterviewer } from '../controller/user.controller';
import { verifyToken, isHRAdmin } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', verifyToken, isHRAdmin, createInterviewer);
router.get('/', verifyToken, isHRAdmin, getAllInterviewers);
router.put('/:id', verifyToken, isHRAdmin, updateInterviewer);
router.delete('/:id', verifyToken, isHRAdmin, deleteInterviewer);

export default router;
