/**
 * Process entry point. Starts HTTP on PORT (default 4000).
 * App wiring lives in app.js so it can be imported without binding a port.
 */
import app from './app.js';

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});