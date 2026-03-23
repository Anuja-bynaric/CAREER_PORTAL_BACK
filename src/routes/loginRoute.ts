import express from 'express';
import { loginUser, getMe } from '../controller/loginController';

import { finalizeApplication } from '../controller/jobApplication';
import { createAdminOrHR } from '../controller/user.controller';


const router = express.Router();

router.get('/me', getMe);
router.post('/finalize-application', finalizeApplication);


router.post('/login', loginUser);

router.post('/create-admin', createAdminOrHR);

export default router;