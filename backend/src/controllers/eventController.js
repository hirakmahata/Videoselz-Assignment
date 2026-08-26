/**
 * Event HTTP adapters.
 *
 * Keep these thin: parse happens in the service, status codes live here
 * (201 on create). Thrown HttpErrors fall through to errorHandler via next().
 */
import { createEvent, listVideoCatalog } from '../services/eventService.js';

/** POST /api/events */
export async function postEvent(req, res, next) {
  try {
    const event = await createEvent(req.body);
    res.status(201).json({ data: event });
  } catch (err) {
    next(err);
  }
}

/** GET /api/videos */
export async function getVideoCatalog(req, res, next) {
  try {
    const data = await listVideoCatalog();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
