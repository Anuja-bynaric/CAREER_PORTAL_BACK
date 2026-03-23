import express from 'express';
import { loginUser, getMe, logoutUser } from '../controller/loginController';

import { finalizeApplication } from '../controller/jobApplication';
import { createAdminOrHR, getCandidateById } from '../controller/user.controller';
import { verifyToken, isHRAdmin } from '../middleware/authMiddleware';


const router = express.Router();

router.get('/me', getMe);
router.post('/finalize-application', finalizeApplication);
router.get('/candidate/:id', verifyToken, isHRAdmin, getCandidateById);

router.post('/login', loginUser);

router.post('/logout', logoutUser);

router.post('/create-admin', createAdminOrHR);



export default router;