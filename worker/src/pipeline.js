const logger = require('./utils/logger');
const { scrapeYouTubeFreeCodeCamp } = require('./scrapers/youtube');
const { fetchOpenCourseData } = require('./scrapers/opencourse');
const { deduplicateCourses } = require('./utils/dedup');
const { pushToBackend } = require('./utils/api');

const runPipeline = async () => {
  const startTime = Date.now();
  logger.info('═══════════════════════════════');
  logger.info('Starting FreeCourseHub pipeline');
  logger.info('═══════════════════════════════');

  const allCourses = [];
  const results = {
    scrapers: {},
    total: 0,
    deduplicated: 0,
    pushed: 0,
    errors: [],
  };

  // Run all scrapers in parallel with error isolation
  const scraperTasks = [
    { name: 'YouTube/freeCodeCamp', fn: scrapeYouTubeFreeCodeCamp },
    { name: 'OpenCourseData', fn: fetchOpenCourseData },
  ];

  await Promise.all(
    scraperTasks.map(async ({ name, fn }) => {
      try {
        logger.info(`Running scraper: ${name}`);
        const courses = await fn();
        allCourses.push(...courses);
        results.scrapers[name] = { count: courses.length, status: 'success' };
        logger.info(`Scraper ${name}: fetched ${courses.length} courses`);
      } catch (err) {
        const errMsg = `Scraper ${name} failed: ${err.message}`;
        logger.error(errMsg);
        results.scrapers[name] = { count: 0, status: 'error', error: err.message };
        results.errors.push(errMsg);
      }
    })
  );

  results.total = allCourses.length;
  logger.info(`Total raw courses collected: ${allCourses.length}`);

  // Deduplicate
  const uniqueCourses = deduplicateCourses(allCourses);
  results.deduplicated = uniqueCourses.length;
  logger.info(`After deduplication: ${uniqueCourses.length} unique courses`);

  // Push to backend API
  if (uniqueCourses.length > 0) {
    try {
      const pushResult = await pushToBackend(uniqueCourses);
      results.pushed = pushResult.pushed || 0;
      logger.info(`Pushed ${results.pushed} courses to backend`);
    } catch (err) {
      logger.error(`Failed to push to backend: ${err.message}`);
      results.errors.push(`Backend push failed: ${err.message}`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  logger.info(`Pipeline complete in ${elapsed}s`);
  logger.info(`Summary: ${results.total} fetched → ${results.deduplicated} unique → ${results.pushed} pushed`);

  if (results.errors.length > 0) {
    logger.warn(`Pipeline completed with ${results.errors.length} errors`);
  }

  return results;
};

module.exports = { runPipeline };
