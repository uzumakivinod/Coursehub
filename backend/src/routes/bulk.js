const express = require('express');
const router  = express.Router();
const courseService = require('../services/courseService');
const { clearCachePattern } = require('../services/cache');
const logger = require('../utils/logger');

// Internal auth middleware — worker uses a shared secret key
const workerAuth = (req, res, next) => {
  const key = req.headers['x-worker-key'];
  const expected = process.env.WORKER_API_KEY;
  if (!expected || key !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// POST /api/courses/bulk — worker pushes new/updated courses
router.post('/bulk', workerAuth, async (req, res) => {
  try {
    const courses = req.body;
    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ error: 'Body must be a non-empty array of courses' });
    }
    if (courses.length > 500) {
      return res.status(400).json({ error: 'Max 500 courses per batch' });
    }

    const result = courseService.upsertCourses(courses);

    // Invalidate relevant caches
    await clearCachePattern('courses:*');
    await clearCachePattern('search:*');
    await clearCachePattern('trending:*');
    await clearCachePattern('filters:*');

    logger.info(`Worker bulk upsert: ${result.added} added, ${result.updated} updated`);
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error(`POST /courses/bulk error: ${err.message}`);
    res.status(500).json({ error: 'Bulk upsert failed' });
  }
});

module.exports = router;
