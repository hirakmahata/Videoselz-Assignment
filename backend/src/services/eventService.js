/**
 * Event ingestion (POST /api/events) and the id/title catalog (GET /api/videos).
 *
 * The payload is a storefront webhook: videoId + eventType. Prisma fills
 * timestamp with now(). A missing video FK (P2003) becomes a 404.
 */
import { Prisma, prisma } from '../db.js';
import { badRequest, notFound } from '../middleware/errorHandler.js';

const EVENT_TYPES = new Set(['view', 'click', 'add_to_cart']);

/**
 * Validates a webhook-style event body.
 * @param {unknown} body
 * @returns {{ videoId: number, eventType: string }}
 */
export function parseEventPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Request body must be a JSON object');
  }

  const details = [];
  const videoId = Number(body.videoId);
  const eventType = body.eventType;

  if (!Number.isInteger(videoId) || videoId <= 0) {
    details.push({ field: 'videoId', message: 'Must be a positive integer' });
  }

  if (!EVENT_TYPES.has(eventType)) {
    details.push({
      field: 'eventType',
      message: "Must be 'view', 'click', or 'add_to_cart'",
    });
  }

  if (details.length > 0) {
    throw badRequest('Invalid engagement event payload', details);
  }

  return { videoId, eventType };
}

/**
 * Inserts one engagement event. Unknown video IDs surface as 404 (Prisma P2003).
 * @param {unknown} payload
 */
export async function createEvent(payload) {
  const { videoId, eventType } = parseEventPayload(payload);

  try {
    const event = await prisma.engagementEvent.create({
      data: { videoId, eventType },
    });

    return {
      id: event.id,
      videoId: event.videoId,
      eventType: event.eventType,
      timestamp: event.timestamp.toISOString(),
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw notFound(`Video ${videoId} does not exist`);
    }

    throw err;
  }
}

