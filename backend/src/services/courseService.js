const Fuse = require('fuse.js');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// In-memory store (falls back from MongoDB)
let coursesDB = [];
let fuseInstance = null;

// Load initial data from JSON file
const loadInitialData = () => {
  try {
    const data = require('../data/courses.json');
    coursesDB = data.map(course => ({
      ...course,
      id: course.id || uuidv4(),
      createdAt: course.createdAt || new Date().toISOString(),
      updatedAt: course.updatedAt || new Date().toISOString(),
    }));
    rebuildFuseIndex();
    logger.info(`Loaded ${coursesDB.length} courses into memory`);
  } catch (err) {
    logger.error(`Failed to load initial data: ${err.message}`);
    coursesDB = [];
  }
};

// Build Fuse.js fuzzy search index
const rebuildFuseIndex = () => {
  const options = {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'description', weight: 0.2 },
      { name: 'tags', weight: 0.2 },
      { name: 'instructor', weight: 0.1 },
      { name: 'provider', weight: 0.1 },
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
  };
  fuseInstance = new Fuse(coursesDB, options);
  logger.debug('Fuse.js search index rebuilt');
};

// Get all courses with pagination & filters
const getAllCourses = ({ page = 1, limit = 12, platform, level, category, sort = 'rating' } = {}) => {
  let results = [...coursesDB];

  // Filters
  if (platform && platform !== 'all') {
    results = results.filter(c => c.platform.toLowerCase() === platform.toLowerCase());
  }
  if (level && level !== 'all') {
    results = results.filter(c => c.level.toLowerCase() === level.toLowerCase());
  }
  if (category && category !== 'all') {
    results = results.filter(c => c.category.toLowerCase() === category.toLowerCase());
  }

  // Sorting
  switch (sort) {
    case 'rating':
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'newest':
      results.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0));
      break;
    case 'popular':
      results.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
      break;
    case 'duration_asc':
      results.sort((a, b) => (a.durationHours || 0) - (b.durationHours || 0));
      break;
    case 'duration_desc':
      results.sort((a, b) => (b.durationHours || 0) - (a.durationHours || 0));
      break;
    default:
      results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  const total = results.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginated = results.slice(offset, offset + limit);

  return {
    courses: paginated,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// Search courses
const searchCourses = ({ query, platform, level, category, duration, page = 1, limit = 12, sort = 'relevance' } = {}) => {
  let results = [];

  if (query && query.trim().length > 0) {
    if (!fuseInstance) rebuildFuseIndex();
    const fuseResults = fuseInstance.search(query.trim());
    results = fuseResults.map(r => ({ ...r.item, _score: r.score }));
  } else {
    results = [...coursesDB];
  }

  // Apply filters
  if (platform && platform !== 'all') {
    results = results.filter(c => c.platform.toLowerCase() === platform.toLowerCase());
  }
  if (level && level !== 'all') {
    results = results.filter(c => c.level.toLowerCase() === level.toLowerCase());
  }
  if (category && category !== 'all') {
    results = results.filter(c => c.category.toLowerCase() === category.toLowerCase());
  }
  if (duration && duration !== 'all') {
    switch (duration) {
      case 'short': results = results.filter(c => (c.durationHours || 0) <= 10); break;
      case 'medium': results = results.filter(c => (c.durationHours || 0) > 10 && (c.durationHours || 0) <= 40); break;
      case 'long': results = results.filter(c => (c.durationHours || 0) > 40); break;
    }
  }

  // Sort (non-relevance)
  if (sort !== 'relevance') {
    switch (sort) {
      case 'rating': results.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'popular': results.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0)); break;
      case 'newest': results.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0)); break;
    }
  }

  const total = results.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginated = results.slice(offset, offset + limit);

  return {
    courses: paginated,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    query,
  };
};

// Get course by ID
const getCourseById = (id) => {
  return coursesDB.find(c => c.id === id) || null;
};

// Get trending courses (high enrollment + high rating)
const getTrendingCourses = (limit = 8) => {
  return [...coursesDB]
    .sort((a, b) => {
      const scoreA = (a.rating || 0) * Math.log((a.enrollmentCount || 1) + 1);
      const scoreB = (b.rating || 0) * Math.log((b.enrollmentCount || 1) + 1);
      return scoreB - scoreA;
    })
    .slice(0, limit);
};

// Get unique filter options
const getFilterOptions = () => {
  const platforms = [...new Set(coursesDB.map(c => c.platform))].sort();
  const levels = [...new Set(coursesDB.map(c => c.level))].sort();
  const categories = [...new Set(coursesDB.map(c => c.category))].sort();
  const tags = [...new Set(coursesDB.flatMap(c => c.tags || []))].sort();

  return { platforms, levels, categories, tags };
};

// Get stats
const getStats = () => ({
  totalCourses: coursesDB.length,
  platforms: [...new Set(coursesDB.map(c => c.platform))].length,
  categories: [...new Set(coursesDB.map(c => c.category))].length,
  avgRating: (coursesDB.reduce((s, c) => s + (c.rating || 0), 0) / coursesDB.length).toFixed(2),
});

// Upsert courses (for worker)
const upsertCourses = (newCourses) => {
  let added = 0;
  let updated = 0;

  newCourses.forEach(course => {
    const existingIdx = coursesDB.findIndex(c =>
      c.link === course.link || c.title === course.title
    );
    if (existingIdx >= 0) {
      coursesDB[existingIdx] = { ...coursesDB[existingIdx], ...course, updatedAt: new Date().toISOString() };
      updated++;
    } else {
      coursesDB.push({ ...course, id: course.id || uuidv4(), createdAt: new Date().toISOString() });
      added++;
    }
  });

  rebuildFuseIndex();
  logger.info(`Upserted courses: ${added} added, ${updated} updated`);
  return { added, updated };
};

// Initialize
loadInitialData();

module.exports = {
  getAllCourses,
  searchCourses,
  getCourseById,
  getTrendingCourses,
  getFilterOptions,
  getStats,
  upsertCourses,
  loadInitialData,
};
