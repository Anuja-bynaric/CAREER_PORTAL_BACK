import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure 'uploads' directory exists
const uploadDir = 'uploads/resumes';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename: timestamp-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, and DOCX files are allowed!'), false);
    }
};

export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
   
});

// For bulk zip upload
const zipStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = 'uploads/temp';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const zipFileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
        cb(null, true);
    } else {
        cb(new Error('Only ZIP files are allowed for bulk upload!'), false);
    }
};

export const uploadZip = multer({
    storage: zipStorage,
    fileFilter: zipFileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});