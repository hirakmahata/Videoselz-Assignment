/**
 * Video analytics read-model.
 *
 * Two queries run besides the page of rows:
 *   1. COUNT(videos) — pagination.total must not depend on event volume
 *   2. storewide CASE sums — KPI cards stay correct on page 2+
 *
 * Per-video counts use one LEFT JOIN + SUM(CASE …). Joining
 * engagement_events once per event type would multiply rows (cartesian
 * product) and inflate views/clicks/add-to-carts. LEFT JOIN keeps videos
 * with zero events visible.
 */
import { prisma } from '../db.js';
import { badRequest } from '../middleware/errorHandler.js';

/** Prisma $queryRaw may return BigInt for aggregates; normalize to Number. */
function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

/**
 * @param {Record<string, unknown>} query
 * @returns {{ page: number, limit: number }}
 */
export function parsePagination(query) {
  // Defaults match the dashboard (page 1, 10 rows). Cap limit so a client
  // cannot request an unbounded result set.
  const pageRaw = query.page === undefined ? 1 : Number(query.page);
  const limitRaw = query.limit === undefined ? 10 : Number(query.limit);
  const details = [];

  if (!Number.isInteger(pageRaw) || pageRaw < 1) {
    details.push({ field: 'page', message: 'Must be an integer greater than 0' });
  }

  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > 50) {
    details.push({ field: 'limit', message: 'Must be an integer between 1 and 50' });
  }

  if (details.length > 0) {
    throw badRequest('Invalid pagination query', details);
  }

  return { page: pageRaw, limit: limitRaw };
}

/** Maps snake_case SQL aliases to the camelCase JSON the frontend expects. */
function mapVideoRow(row) {
  return {
    id: toNumber(row.id),
    title: row.title,
    videoUrl: row.video_url,
    productId: toNumber(row.product_id),
    productName: row.product_name,
    productPriceCents: toNumber(row.product_price),
    views: toNumber(row.views),
    clicks: toNumber(row.clicks),
    addToCart: toNumber(row.add_to_cart),
  };
}

/**
 * @param {{ page: number, limit: number }} params
 */
export async function listVideoAnalytics({ page, limit }) {
  const offset = (page - 1) * limit;

  // Run count, store totals, and the page in parallel — they do not depend
  // on each other.
  const [total, totals, rows] = await Promise.all([
    prisma.video.count(),
    prisma.$queryRaw`
      SELECT
        COALESCE(SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END), 0) AS views,
        COALESCE(SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END), 0) AS clicks,
        COALESCE(SUM(CASE WHEN event_type = 'add_to_cart' THEN 1 ELSE 0 END), 0) AS add_to_cart
      FROM engagement_events
    `,
    // Single LEFT JOIN + conditional aggregation. Multiple joins on
    // engagement_events (one per event type) would multiply rows.
    prisma.$queryRaw`
      SELECT
        v.id,
        v.title,
        v.video_url,
        v.product_id,
        p.name AS product_name,
        p.price AS product_price,
        COALESCE(SUM(CASE WHEN e.event_type = 'view' THEN 1 ELSE 0 END), 0) AS views,
        COALESCE(SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END), 0) AS clicks,
        COALESCE(SUM(CASE WHEN e.event_type = 'add_to_cart' THEN 1 ELSE 0 END), 0) AS add_to_cart
      FROM videos v
      INNER JOIN products p ON p.id = v.product_id
      LEFT JOIN engagement_events e ON e.video_id = v.id
      GROUP BY v.id, v.title, v.video_url, v.product_id, p.name, p.price
      ORDER BY views DESC, v.id ASC
      LIMIT ${limit} OFFSET ${offset}
    `,
  ]);

  const storeTotals = totals[0] || { views: 0, clicks: 0, add_to_cart: 0 };

  return {
    data: rows.map(mapVideoRow),
    totals: {
      views: toNumber(storeTotals.views),
      clicks: toNumber(storeTotals.clicks),
      addToCart: toNumber(storeTotals.add_to_cart),
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
