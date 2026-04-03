require('dotenv').config();
const cron = require('node-cron');
const logger = require('./utils/logger');
const { runPipeline } = require('./pipeline');

logger.info('FreeCourseHub Worker starting...');

// Run immediately on start
(async () => {
  logger.info('Running initial data pipeline...');
  await runPipeline();
})();

// Schedule daily run at 3:00 AM UTC
cron.schedule('0 3 * * *', async () => {
  logger.info('Daily pipeline triggered by cron');
  await runPipeline();
}, {
  scheduled: true,
  timezone: 'UTC',
});

// Health check every 5 minutes
cron.schedule('*/5 * * * *', () => {
  logger.info('Worker heartbeat - status: running');
});

logger.info('Worker scheduled. Daily sync at 03:00 UTC.');

process.on('SIGTERM', () => {
  logger.info('Worker shutting down...');
  process.exit(0);
});
