import { Router } from "express";
import { uploadBulkResumes, getResumes, getResumeById } from '../controllers/resume.controller';
import { uploadZip } from '../config/multer';
import { verifyToken, isHRAdmin } from '../middleware/authMiddleware';

const router = Router();

// Bulk upload resumes (HR only)
router.post('/bulk-upload', verifyToken, isHRAdmin, (req, res, next) => {
    uploadZip.single('zipFile')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "File upload error"
            });
        }
        next();
    });
}, uploadBulkResumes);

// Get all resumes (HR only)
router.get('/', verifyToken, isHRAdmin, getResumes);

// Get resume by ID (HR only)
router.get('/:id', verifyToken, isHRAdmin, getResumeById);

export default router;