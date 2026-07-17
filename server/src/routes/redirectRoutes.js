import express from 'express';
import { handleRedirect, getPublicQRData } from '../controllers/redirectController.js';

const router = express.Router();

// Public route for scanner redirects
router.get('/:shortUrl', handleRedirect);

// Public route for fetching QR details for read-only pages (Multi-link, digital card)
router.get('/public/:id', getPublicQRData);

export default router;
