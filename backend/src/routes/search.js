const express = require('express');
const router = express.Router();
const { query, validationResult } = require('express-validator');
const courseService = require('../services/courseService');
const { getCache, setCache } = require('../services/cache');
const logger = require('../utils/logger');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// GET /api/search?q=...&platform=...&level=...
router.get('/',
  [
    query('q').optional().trim().isLength({ max: 200 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('platform').optional().trim(),
    query('level').optional().trim().isIn(['', 'all', 'Beginner', 'Intermediate', 'Advanced']),
    query('category').optional().trim(),
    query('duration').optional().trim().isIn(['', 'all', 'short', 'medium', 'long']),
    query('sort').optional().trim().isIn(['relevance', 'rating', 'popular', 'newest']),
  ],
  validate,
  async (req, res) => {
    try {
      const {
        q: query = '',
        page = 1,
        limit = 12,
        platform = 'all',
        level = 'all',
        category = 'all',
        duration = 'all',
        sort = 'relevance',
      } = req.query;

      // Build cache key
      const cacheKey = `search:${query.toLowerCase()}:${platform}:${level}:${category}:${duration}:${sort}:${page}:${limit}`;

      // Try cache first
      const cached = await getCache(cacheKey);
      if (cached) {
        logger.debug(`Search cache hit: "${query}"`);
        return res.json({ ...cached, cached: true });
      }

      const startTime = Date.now();
      const result = courseService.searchCourses({
        query,
        platform,
        level,
        category,
        duration,
        page,
        limit,
        sort,
      });

      const elapsed = Date.now() - startTime;
      const response = {
        ...result,
        searchTime: `${elapsed}ms`,
        cached: false,
      };

      // Cache for 1 hour
      await setCache(cacheKey, response, 3600);

      logger.info(`Search: "${query}" → ${result.pagination.total} results (${elapsed}ms)`);
      res.json(response);
    } catch (err) {
      logger.error(`GET /search error: ${err.message}`);
      res.status(500).json({ error: 'Search failed. Please try again.' });
    }
  }
);

// GET /api/search/suggestions?q=...
router.get('/suggestions', async (req, res) => {
  try {
    const { q = '' } = req.query;
    if (!q || q.length < 2) return res.json({ suggestions: [] });

    const cacheKey = `suggestions:${q.toLowerCase()}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ suggestions: cached, cached: true });

    const result = courseService.searchCourses({ query: q, limit: 5 });
    const suggestions = result.courses.map(c => ({
      id: c.id,
      title: c.title,
      platform: c.platform,
      category: c.category,
    }));

    await setCache(cacheKey, suggestions, 600); // 10 min
    res.json({ suggestions, cached: false });
  } catch (err) {
    logger.error(`GET /search/suggestions error: ${err.message}`);
    res.status(500).json({ error: 'Could not fetch suggestions' });
  }
});

module.exports = router;
