import express from 'express';
import { loginUser } from '../controller/loginController';
import { finalizeApplication } from '../controller/jobApplication';

const router = express.Router();


router.post('/finalize-application', finalizeApplication);


router.post('/login', loginUser);

export default router;