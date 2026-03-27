import express from 'express';
import { loginUser, getMe, logoutUser } from '../controllers/auth.controller';

import { finalizeApplication } from '../controllers/jobApplication.controller';
import { createAdminOrHR } from '../controllers/user.controller';
import { verifyToken, isHRAdmin } from '../middleware/authMiddleware';


const router = express.Router();

router.get('/me', getMe);
router.post('/finalize-application', finalizeApplication);
// router.get('/candidate/:id', verifyToken, isHRAdmin, getCandidateById);

router.post('/login', loginUser);

router.post('/logout', logoutUser);

router.post('/create-admin', createAdminOrHR);



export default router;