import express from 'express';
import { getQRAnalytics, getDashboardSummary } from '../controllers/analyticsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/summary', getDashboardSummary);
router.get('/:id', getQRAnalytics);

export default router;
