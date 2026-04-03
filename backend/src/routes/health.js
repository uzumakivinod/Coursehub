const express = require('express');
const router = express.Router();
const { getCacheStats, isConnected } = require('../services/cache');
const courseService = require('../services/courseService');

router.get('/', async (req, res) => {
  const cacheStats = await getCacheStats();
  const stats = courseService.getStats();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    redis: {
      connected: isConnected(),
      ...cacheStats,
    },
    courses: stats,
  });
});

// Kubernetes/Docker liveness probe
router.get('/live', (req, res) => res.status(200).json({ status: 'alive' }));

// Kubernetes/Docker readiness probe
router.get('/ready', (req, res) => {
  const stats = courseService.getStats();
  if (stats.totalCourses > 0) {
    return res.status(200).json({ status: 'ready', courses: stats.totalCourses });
  }
  res.status(503).json({ status: 'not ready', message: 'Data not loaded' });
});

module.exports = router;
