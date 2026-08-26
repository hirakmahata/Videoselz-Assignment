/**
 * Express application factory (no listen() here).
 *
 * Request flow:
 *   CORS + JSON parse → API routes → 404 → error handler
 *
 * In `npm run dev`, Vite serves the UI on :5173 and proxies /api here.
 */
import cors from 'cors';
import express from 'express';

import { getVideoCatalog } from './controllers/eventController.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import eventRoutes from './routes/eventRoutes.js';

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
// Small cap: events are tiny webhook payloads, not file uploads.
app.use(express.json({ limit: '32kb' }));

// Health/status check endpoint.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/events', eventRoutes);
// Catalog is separate from analytics so Simulate Traffic can pick any video
// without fetching a full aggregated page.
app.get('/api/videos', getVideoCatalog);
app.use('/api/analytics', analyticsRoutes);

// 404 and error handlers.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
