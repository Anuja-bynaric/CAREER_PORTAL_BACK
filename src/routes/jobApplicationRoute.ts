import { Router } from "express";
import { createApplication, downloadResume, finalizeApplication, updateApplicationStatus, getCandidatesByJobId, getCandidateByJobIdById, getMyApplications } from '../controller/jobApplication';
import { upload } from '../../config/multer';
import { verifyToken, isHRAdmin } from '../middleware/authMiddleware';
import {setPassword } from "../controller/user.controller";

const router = Router();


router.get('/my-applications', getMyApplications);
// Endpoint: POST /user/applyJob
//router.post('/applyJob', createApplication);
// router.post('/apply', applyJob);
router.post('/set-password', setPassword);

// Notice 'resume' here - this must match the key in Postman/Frontend
// This step sends the email

router.post('/applyJob', (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                console.error("Multer Unexpected Field Error. Field:", err.field);
                return res.status(400).json({ 
                    success: false, 
                    message: `Unexpected field: ${err.field}. Expected 'resume'.` 
                });
            }
            return res.status(400).json({ 
                success: false, 
                message: err.message || "File upload error" 
            });
        }
        next();
    });
}, createApplication);


router.post('/finalize-application', finalizeApplication);

router.get('/resume/:filename', downloadResume);

// HR Only Route
router.patch('/:id/status', verifyToken, isHRAdmin, updateApplicationStatus);

// Get candidates by jobId
router.get('/job/:jobId/candidates', verifyToken, isHRAdmin, getCandidatesByJobId);

router.get('/candidates/:jobId/:id', verifyToken, isHRAdmin, getCandidateByJobIdById);

export default router;