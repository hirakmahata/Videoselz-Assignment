/**
 * Analytics HTTP adapter.
 *
 * Query-string validation (page/limit) happens before the SQL aggregation
 * so bad pagination never hits the database.
 */
import { listVideoAnalytics, parsePagination } from '../services/analyticsService.js';

/** GET /api/analytics/videos */
export async function getVideoAnalytics(req, res, next) {
  try {
    const pagination = parsePagination(req.query);
    const result = await listVideoAnalytics(pagination);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
