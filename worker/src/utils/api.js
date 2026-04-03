const axios = require('axios');
const logger = require('./logger');

const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:5000';
const WORKER_API_KEY = process.env.WORKER_API_KEY || '';
const BATCH_SIZE = 50;

const pushToBackend = async (courses) => {
  let pushed = 0;

  // Push in batches
  for (let i = 0; i < courses.length; i += BATCH_SIZE) {
    const batch = courses.slice(i, i + BATCH_SIZE);
    try {
      await axios.post(`${BACKEND_URL}/api/courses/bulk`, batch, {
        headers: {
          'Content-Type': 'application/json',
          'x-worker-key': WORKER_API_KEY,
        },
        timeout: 15000,
      });
      pushed += batch.length;
      logger.debug(`Pushed batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} courses`);
    } catch (err) {
      logger.error(`Failed to push batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message}`);
    }
  }

  return { pushed };
};

module.exports = { pushToBackend };
