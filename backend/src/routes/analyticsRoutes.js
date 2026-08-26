/**
 * Analytics routes, mounted at /api/analytics in app.js.
 * GET /videos → paginated views / clicks / add-to-carts per video.
 */
import { Router } from 'express';
import { getVideoAnalytics } from '../controllers/analyticsController.js';

const router = Router();

router.get('/videos', getVideoAnalytics);

export default router;
