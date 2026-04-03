const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Fetches free courses from freeCodeCamp's GitHub channel list
 * Uses YouTube Data API v3 (free tier: 10,000 units/day)
 * Falls back to static dataset if API not available
 */
const scrapeYouTubeFreeCodeCamp = async () => {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    return fetchFromYouTubeAPI(apiKey);
  }

  logger.warn('YOUTUBE_API_KEY not set. Using static YouTube dataset.');
  return getStaticYouTubeCourses();
};

const fetchFromYouTubeAPI = async (apiKey) => {
  const courses = [];
  const channelIds = [
    'UC8butISFwT-Wl7EV0hUK0BQ', // freeCodeCamp
    'UCVTlvUkGslCV_h-nSAId8Sw', // Traversy Media
  ];

  for (const channelId of channelIds) {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          channelId,
          type: 'video',
          maxResults: 10,
          order: 'viewCount',
          videoDuration: 'long',
          key: apiKey,
        },
        timeout: 10000,
      });

      response.data.items.forEach(item => {
        courses.push({
          id: uuidv4(),
          title: item.snippet.title,
          platform: 'YouTube',
          provider: item.snippet.channelTitle,
          instructor: item.snippet.channelTitle,
          duration: 'Varies',
          durationHours: 0,
          rating: 4.5,
          ratingCount: 0,
          level: detectLevel(item.snippet.title),
          tags: extractTags(item.snippet.title),
          category: detectCategory(item.snippet.title),
          language: 'English',
          link: `https://youtube.com/watch?v=${item.id.videoId}`,
          thumbnail: item.snippet.thumbnails?.medium?.url || '',
          description: item.snippet.description,
          isFree: true,
          enrollmentCount: 0,
          lastUpdated: item.snippet.publishedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          certificate: false,
        });
      });
    } catch (err) {
      logger.warn(`YouTube API error for channel ${channelId}: ${err.message}`);
    }
  }

  return courses;
};

const getStaticYouTubeCourses = () => {
  // Static fallback dataset of well-known free YouTube courses
  return [
    {
      id: uuidv4(),
      title: 'Python Tutorial for Beginners - Full Course',
      platform: 'YouTube',
      provider: 'freeCodeCamp',
      instructor: 'Mosh Hamedani',
      duration: '6 hours',
      durationHours: 6,
      rating: 4.8,
      ratingCount: 95000,
      level: 'Beginner',
      tags: ['Python', 'Programming', 'Beginner'],
      category: 'Programming',
      language: 'English',
      link: 'https://www.youtube.com/watch?v=rfscVS0vtbw',
      thumbnail: 'https://placehold.co/400x225/ff0000/white?text=Python+Tutorial',
      description: 'Learn Python with this full beginner course from freeCodeCamp.',
      isFree: true,
      enrollmentCount: 2500000,
      lastUpdated: new Date().toISOString().split('T')[0],
      certificate: false,
    },
    {
      id: uuidv4(),
      title: 'TypeScript Full Course for Beginners',
      platform: 'YouTube',
      provider: 'freeCodeCamp',
      instructor: 'Dave Gray',
      duration: '8 hours',
      durationHours: 8,
      rating: 4.7,
      ratingCount: 42000,
      level: 'Beginner',
      tags: ['TypeScript', 'JavaScript', 'Web Development'],
      category: 'Web Development',
      language: 'English',
      link: 'https://www.youtube.com/watch?v=30LWjhZzg50',
      thumbnail: 'https://placehold.co/400x225/3178c6/white?text=TypeScript',
      description: 'Complete TypeScript course for beginners covering all fundamentals.',
      isFree: true,
      enrollmentCount: 680000,
      lastUpdated: new Date().toISOString().split('T')[0],
      certificate: false,
    },
  ];
};

// Utility helpers
const detectLevel = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('beginner') || t.includes('introduction') || t.includes('basics') || t.includes('for beginners')) return 'Beginner';
  if (t.includes('advanced') || t.includes('expert') || t.includes('master')) return 'Advanced';
  return 'Intermediate';
};

const extractTags = (title = '') => {
  const keywords = ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Docker',
    'Kubernetes', 'AWS', 'Machine Learning', 'Deep Learning', 'SQL', 'MongoDB',
    'CSS', 'HTML', 'Java', 'Go', 'Rust', 'C++', 'Flutter', 'Swift'];
  return keywords.filter(k => title.toLowerCase().includes(k.toLowerCase())).slice(0, 5);
};

const detectCategory = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('machine learning') || t.includes('deep learning') || t.includes('data science')) return 'Data Science & ML';
  if (t.includes('react') || t.includes('javascript') || t.includes('html') || t.includes('css') || t.includes('web')) return 'Web Development';
  if (t.includes('docker') || t.includes('kubernetes') || t.includes('devops') || t.includes('cicd')) return 'DevOps';
  if (t.includes('python') || t.includes('java') || t.includes('go ') || t.includes('rust')) return 'Programming';
  if (t.includes('aws') || t.includes('gcp') || t.includes('azure') || t.includes('cloud')) return 'Cloud Computing';
  if (t.includes('security') || t.includes('hacking')) return 'Cybersecurity';
  return 'General';
};

module.exports = { scrapeYouTubeFreeCodeCamp };
