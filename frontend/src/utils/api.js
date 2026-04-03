import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

// ── Courses ────────────────────────────────────────────────
export const fetchCourses = (params = {}) =>
  api.get('/courses', { params }).then((r) => r.data);

export const fetchCourse = (id) =>
  api.get(`/courses/${id}`).then((r) => r.data);

export const fetchTrending = (limit = 8) =>
  api.get('/courses/trending', { params: { limit } }).then((r) => r.data);

export const fetchFilters = () =>
  api.get('/courses/filters').then((r) => r.data);

export const fetchStats = () =>
  api.get('/courses/stats').then((r) => r.data);

// ── Search ─────────────────────────────────────────────────
export const searchCourses = (params = {}) =>
  api.get('/search', { params }).then((r) => r.data);

export const fetchSuggestions = (q) =>
  api.get('/search/suggestions', { params: { q } }).then((r) => r.data);

// ── Health ─────────────────────────────────────────────────
export const fetchHealth = () =>
  api.get('/health').then((r) => r.data);

export default api;
