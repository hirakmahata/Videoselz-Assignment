/**
 * Event routes, mounted at /api/events in app.js.
 * POST / → ingest one engagement event (webhook simulation).
 */
import { Router } from 'express';
import { postEvent } from '../controllers/eventController.js';

const router = Router();

router.post('/', postEvent);

export default router;
