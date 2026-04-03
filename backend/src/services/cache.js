const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis = null;
let redisConnected = false;

const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 3600; // 1 hour default

const createRedisClient = () => {
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis connection failed after 3 attempts. Running without cache.');
        return null; // stop retrying
      }
      return Math.min(times * 200, 1000);
    },
    enableOfflineQueue: false,
    connectTimeout: 5000,
    lazyConnect: true,
  });

  client.on('connect', () => {
    redisConnected = true;
    logger.info('Redis connected successfully');
  });

  client.on('error', (err) => {
    redisConnected = false;
    logger.warn(`Redis error: ${err.message}`);
  });

  client.on('close', () => {
    redisConnected = false;
    logger.warn('Redis connection closed');
  });

  return client;
};

// Initialize Redis
const initRedis = async () => {
  try {
    redis = createRedisClient();
    await redis.connect();
  } catch (err) {
    logger.warn(`Failed to connect to Redis: ${err.message}. Continuing without cache.`);
    redis = null;
    redisConnected = false;
  }
};

// Get from cache
const getCache = async (key) => {
  if (!redisConnected || !redis) return null;
  try {
    const data = await redis.get(key);
    if (data) {
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(data);
    }
    logger.debug(`Cache MISS: ${key}`);
    return null;
  } catch (err) {
    logger.warn(`Cache get error: ${err.message}`);
    return null;
  }
};

// Set cache
const setCache = async (key, data, ttl = CACHE_TTL) => {
  if (!redisConnected || !redis) return false;
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
    logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (err) {
    logger.warn(`Cache set error: ${err.message}`);
    return false;
  }
};

// Delete from cache
const deleteCache = async (key) => {
  if (!redisConnected || !redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch (err) {
    logger.warn(`Cache delete error: ${err.message}`);
    return false;
  }
};

// Clear cache by pattern
const clearCachePattern = async (pattern) => {
  if (!redisConnected || !redis) return false;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Cleared ${keys.length} cache keys matching: ${pattern}`);
    }
    return true;
  } catch (err) {
    logger.warn(`Cache clear error: ${err.message}`);
    return false;
  }
};

// Get cache stats
const getCacheStats = async () => {
  if (!redisConnected || !redis) {
    return { connected: false, message: 'Redis not connected' };
  }
  try {
    const info = await redis.info('stats');
    const dbSize = await redis.dbsize();
    return { connected: true, dbSize, info };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};

module.exports = {
  initRedis,
  getCache,
  setCache,
  deleteCache,
  clearCachePattern,
  getCacheStats,
  isConnected: () => redisConnected,
};
