import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import ipfsController from '../controllers/ipfsController.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

/**
 * @swagger
 * /api/ipfs/upload:
 *   post:
 *     summary: Upload a file to IPFS via Pinata
 *     tags: [IPFS]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               userAddress:
 *                 type: string
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Server error
 */
router.post('/upload', upload.single('file'), ipfsController.uploadFile);

/**
 * @swagger
 * /api/ipfs/pin-json:
 *   post:
 *     summary: Pin JSON data to IPFS
 *     tags: [IPFS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: JSON pinned successfully
 *       500:
 *         description: Server error
 */
router.post('/pin-json', ipfsController.pinJSON);

export default router;
