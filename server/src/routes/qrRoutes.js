import express from 'express';
import { getQRs, createQR, updateQR, deleteQR } from '../controllers/qrController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getQRs);

// Accept file uploads for the main content ("file") and QR customization overlay ("logo")
router.post(
  '/',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
  ]),
  createQR
);

router.put(
  '/:id',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
  ]),
  updateQR
);

router.delete('/:id', deleteQR);

export default router;
