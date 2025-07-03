import express from 'express';
import { fetchTrendingNow } from '../controllers/trendsController.js';

const router = express.Router();

// GET /api/trends/now?category=...&location=...
router.get('/now', fetchTrendingNow);

export default router;
