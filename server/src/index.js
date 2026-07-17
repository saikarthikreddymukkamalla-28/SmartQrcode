import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import redirectRoutes from './routes/redirectRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve static paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev/testing, configure for production
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded static files (avatars, logos, PDFs, images, etc.)
app.use('/uploads', express.static(path.join(projectRoot, 'uploads')));

// Public scanner redirect routes (e.g. GET /r/x1Y7z)
app.use('/r', redirectRoutes);

// Private REST API routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/qrs', qrRoutes);
app.use('/analytics', analyticsRoutes);

// Base route to check API status
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Unified QR Platform Backend API is running.',
    timestamp: new Date(),
  });
});

// Error handling middleware
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📂 Uploads directory: ${path.join(projectRoot, 'uploads')}`);
});
