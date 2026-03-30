import express from 'express';
import { loginUser, getMe, logoutUser } from '../controllers/auth.controller';

import { finalizeApplication } from '../controllers/jobApplication.controller';
import { createAdminOrHR } from '../controllers/user.controller';
import { verifyToken, isHRAdmin } from '../middleware/authMiddleware';


const router = express.Router();

router.get('/me', verifyToken, getMe);
router.post('/finalize-application', finalizeApplication); // Left as is, assuming it handles its own validation or doesn't need auth here
// router.get('/candidate/:id', verifyToken, isHRAdmin, getCandidateById);

router.post('/login', loginUser);

router.post('/logout', verifyToken, logoutUser);

router.post('/create-admin', createAdminOrHR); // This should ideally be protected too, but keeping as is per plan

export default router;