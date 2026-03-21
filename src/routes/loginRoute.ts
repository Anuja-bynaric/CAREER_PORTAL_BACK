import express from 'express';
import { loginUser, logoutUser } from '../controller/loginController';
import { finalizeApplication } from '../controller/jobApplication';
import { createAdminOrHR } from '../controller/user.controller';

const router = express.Router();


router.post('/finalize-application', finalizeApplication);


router.post('/login', loginUser);

router.post('/logout', logoutUser);

router.post('/create-admin', createAdminOrHR);

export default router;