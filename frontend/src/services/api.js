/**
 * Browser API client (Axios).
 *
 * Paths are relative (`/api/...`) on purpose:
 *   • Vite proxies them to Express :4000 during `npm run dev`
 *   • After `npm run build`, Express serves UI + API on the same origin
 *
 * A response interceptor unwraps `response.data` and turns API errors into
 * Error objects using the server's `error.message` when present.
 */
import axios from 'axios';

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      `Request failed (${error.response?.status ?? 'network'})`;
    return Promise.reject(new Error(message));
  }
);

/**
 * @param {number} page
 * @param {number} limit
 */
export function fetchVideoAnalytics(page, limit) {
  return api.get('/api/analytics/videos', {
    params: { page, limit },
  });
}

/** @returns {Promise<{ data: Array<{ id: number, title: string }> }>} */
export function fetchVideos() {
  return api.get('/api/videos');
}

/**
 * @param {{ videoId: number, eventType: string }} body
 */
export function createEvent(body) {
  return api.post('/api/events', body);
}
