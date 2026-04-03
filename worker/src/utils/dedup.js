const logger = require('./logger');

/**
 * Deduplicate courses based on URL and title similarity
 */
const deduplicateCourses = (courses) => {
  const seen = new Map();
  const unique = [];

  for (const course of courses) {
    // Primary key: normalized URL
    const urlKey = normalizeUrl(course.link || '');
    // Secondary key: normalized title + platform
    const titleKey = `${normalizeName(course.title)}::${normalizeName(course.platform)}`;

    if (!urlKey && !titleKey) {
      unique.push(course);
      continue;
    }

    if ((urlKey && seen.has(urlKey)) || seen.has(titleKey)) {
      // Merge: keep existing but update with newer data if available
      const existingKey = urlKey && seen.has(urlKey) ? urlKey : titleKey;
      const existingIdx = seen.get(existingKey);
      const existing = unique[existingIdx];

      // Update rating/enrollment if newer data has more info
      if ((course.ratingCount || 0) > (existing.ratingCount || 0)) {
        unique[existingIdx] = { ...existing, ...course, id: existing.id };
      }
      continue;
    }

    const idx = unique.length;
    if (urlKey) seen.set(urlKey, idx);
    seen.set(titleKey, idx);
    unique.push(course);
  }

  const removed = courses.length - unique.length;
  if (removed > 0) {
    logger.info(`Deduplication: removed ${removed} duplicates`);
  }

  return unique;
};

const normalizeUrl = (url) => {
  if (!url) return '';
  try {
    const u = new URL(url);
    // Remove tracking params
    ['utm_source', 'utm_medium', 'utm_campaign', 'ref'].forEach(p => u.searchParams.delete(p));
    return u.toString().toLowerCase().replace(/\/$/, '');
  } catch {
    return url.toLowerCase().trim();
  }
};

const normalizeName = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

module.exports = { deduplicateCourses };
