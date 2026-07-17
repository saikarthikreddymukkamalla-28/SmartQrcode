import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', upload.single('avatar'), updateProfile);

export default router;
