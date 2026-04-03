const express = require('express');
const router = express.Router();
const { query, param, validationResult } = require('express-validator');
const courseService = require('../services/courseService');
const { getCache, setCache } = require('../services/cache');
const logger = require('../utils/logger');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// GET /api/courses - list all with filters
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('platform').optional().trim().escape(),
    query('level').optional().trim().escape(),
    query('category').optional().trim().escape(),
    query('sort').optional().isIn(['rating', 'newest', 'popular', 'duration_asc', 'duration_desc']),
  ],
  validate,
  async (req, res) => {
    try {
      const { page = 1, limit = 12, platform, level, category, sort = 'rating' } = req.query;
      const cacheKey = `courses:${page}:${limit}:${platform}:${level}:${category}:${sort}`;

      // Check cache
      const cached = await getCache(cacheKey);
      if (cached) return res.json({ ...cached, cached: true });

      const result = courseService.getAllCourses({ page, limit, platform, level, category, sort });

      await setCache(cacheKey, result);
      res.json({ ...result, cached: false });
    } catch (err) {
      logger.error(`GET /courses error: ${err.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/courses/trending - trending courses
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const cacheKey = `trending:${limit}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.json({ courses: cached, cached: true });

    const courses = courseService.getTrendingCourses(limit);
    await setCache(cacheKey, courses, 1800); // 30 min TTL for trending
    res.json({ courses, cached: false });
  } catch (err) {
    logger.error(`GET /courses/trending error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/courses/filters - get filter options
router.get('/filters', async (req, res) => {
  try {
    const cacheKey = 'filters:options';
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const filters = courseService.getFilterOptions();
    await setCache(cacheKey, filters, 3600);
    res.json({ ...filters, cached: false });
  } catch (err) {
    logger.error(`GET /courses/filters error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/courses/stats - platform stats
router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'courses:stats';
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    const stats = courseService.getStats();
    await setCache(cacheKey, stats, 600);
    res.json({ ...stats, cached: false });
  } catch (err) {
    logger.error(`GET /courses/stats error: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/courses/:id - single course
router.get('/:id',
  [param('id').trim().notEmpty()],
  validate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const cacheKey = `course:${id}`;

      const cached = await getCache(cacheKey);
      if (cached) return res.json({ course: cached, cached: true });

      const course = courseService.getCourseById(id);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      await setCache(cacheKey, course, 3600);
      res.json({ course, cached: false });
    } catch (err) {
      logger.error(`GET /courses/:id error: ${err.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;
