/**
 * Express application factory (no listen() here).
 *
 */
import cors from 'cors';
import express from 'express';

const app = express();

app.use(cors());
// Small cap: events are tiny webhook payloads, not file uploads.
app.use(express.json({ limit: '32kb' }));

// Health/status check endpoint.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
