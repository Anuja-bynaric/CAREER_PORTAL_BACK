import express from "express";
import { getAnalytics } from "../controllers/analytics.controller";
import { verifyToken, isHRAdmin } from "../middleware/authMiddleware";

const router = express.Router();

router.get('/', verifyToken, isHRAdmin, getAnalytics);

export default router;
