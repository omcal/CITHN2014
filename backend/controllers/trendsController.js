import asyncHandler from '../middleware/asyncHandler.js';
import { getTrendingNow } from '../services/serpTrendsService.js';

export const fetchTrendingNow = asyncHandler(async (req, res) => {
  const { category = '', location = 'United States' } = req.query;
  const trends = await getTrendingNow(category, location);
  res.json(trends);
});
