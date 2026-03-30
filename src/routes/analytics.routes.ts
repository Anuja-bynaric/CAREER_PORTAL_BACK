import express from "express";
import { getAnalytics, getAnalyticsOfInterviewer } from "../controllers/analytics.controller";
import { verifyToken, isHRAdmin, isInterviewer } from "../middleware/authMiddleware";

const router = express.Router();

router.get('/', verifyToken, isHRAdmin, getAnalytics);
router.get('/interviewer/:interviewerId', verifyToken, isInterviewer, getAnalyticsOfInterviewer);

export default router;
