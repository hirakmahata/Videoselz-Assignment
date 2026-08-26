# AI Prompting Log

Videoselz Take-Home Project — August 2026.

Running log of AI interactions used to architect, generate, debug, and document this dashboard. Minor editor autocomplete is omitted. Major features, SQL, and debugging sessions are recorded below.

**Primary tool:** Cursor IDE (agent chat).  
**Allowed tools used:** Cursor only — no ChatGPT / Claude web / Copilot chat sessions.

---

## 1. Scaffold backend + frontend

**Tool Used:** Cursor IDE

**Context/Task:** Initialize two independent packages (Express API + Vite React app) instead of a single root workspace, matching the assignment stack (React, Node/Express, SQLite) and the styling constraint (no Tailwind).

**Exact Prompt Used:**

> Scaffold a Videoselz take-home: React frontend (Vite) and Node.js/Express backend as two separate npm packages (`frontend/` and `backend/`). SQLite later via Prisma. Do not use Tailwind. Keep the frontend as a clean Vite React starter for now. Backend should be ESM Express with a health check. Create an empty `AI_PROMPTING.md` at the repo root.

**Outcome & Adjustments:** Cursor created `backend/` (Express 5, ESM) and `frontend/` (Vite + React 19). I kept packages independent (no root `package.json`). I left `AI_PROMPTING.md` empty until this log was filled. Vite still needed a `/api` proxy later (see entry 8).

---

## 2. Normalized SQLite schema and seed data

**Tool Used:** Cursor IDE

**Context/Task:** Design the required entities (Products, Videos, EngagementEvents) as a normalized SQLite schema and seed enough demo data for a dashboard.

**Exact Prompt Used:**

> Design a normalized SQLite schema with Prisma for:
>
> - Products: ID, Name, Price, CreatedAt
> - Videos: ID, ProductID, VideoURL, Title
> - EngagementEvents: ID, VideoID, EventType (`view`, `click`, `add_to_cart`), Timestamp
>
> Store price as integer cents, not floats. Use snake_case table/column maps. Add a seed script with ~8 products, ~12 videos, and a reproducible mix of historical events. Include `npm` scripts to generate the client, migrate, and seed.

**Outcome & Adjustments:** Prisma models, migration, `prisma.config.ts`, and `prisma/seed.js` landed as expected. I kept `price` as integer cents and added indexes on `videos.product_id` and `(video_id, event_type)`. Seed is idempotent unless `--reset` is passed (`npm run reset-db`). I later added a `prisma:migrate` shortcut in `package.json` after typing the long Prisma CLI command once.

---

## 3. POST /api/events and error handling

**Tool Used:** Cursor IDE

**Context/Task:** Ingest webhook-style engagement events and return consistent JSON errors the React client can display.

**Exact Prompt Used:**

> Implement `POST /api/events` that inserts one engagement event (`videoId`, `eventType`: `view` | `click` | `add_to_cart`). Layer the backend as routes → controllers → services → Prisma. Validate the body. Unknown `videoId` should be 404. Add Express 404 + error middleware so every error is `{ error: { code, message, details? } }`. Timestamp should be set by the database, not the client.

**Outcome & Adjustments:** `parseEventPayload` + Prisma `create` in `eventService.js` worked. Prisma foreign-key failures (`P2003`) are mapped to 404. I added `GET /api/videos` (id + title only) so Simulate Traffic can pick a video that is not on the current table page — that endpoint is extra, not in the brief. JSON body size is capped at 32kb.

---

## 4. GET /api/analytics/videos (SQL aggregation + pagination)

**Tool Used:** Cursor IDE

**Context/Task:** Setting up the SQL aggregation query for the dashboard — videos with total views, clicks, and add-to-cart conversions, plus basic pagination.

**Exact Prompt Used:**

> Implement `GET /api/analytics/videos` with `page` and `limit` query params.
>
> Return each video aggregated with views, clicks, and add_to_cart counts. Videos with zero events must still appear. Conversion rate is **not** calculated here — the frontend will do `addToCart / views`.
>
> I need to `ORDER BY` views and paginate in SQL. Do not join `engagement_events` once per event type (that will cartesian-product rows). Prefer one `LEFT JOIN` and `SUM(CASE WHEN event_type = …)`.
>
> Also return storewide `totals` so KPI cards stay correct on page 2+. Cap `limit` at 50.

**Outcome & Adjustments:** The first draft used three separate joins on `engagement_events` (one per event type), which multiplied rows. I switched to a single `LEFT JOIN` + `SUM(CASE …)` in `prisma.$queryRaw` (see `analyticsService.js`). Prisma aggregates can return BigInt, so I added `toNumber()`. Count, store totals, and the page query run in `Promise.all`. Pagination defaults: page 1, limit 10.

---

## 5. Frontend API client, conversion rate, random events

**Tool Used:** Cursor IDE

**Context/Task:** Browser helpers: Axios client for `/api`, conversion rate on the frontend, and a weighted random payload for Simulate Traffic.

**Exact Prompt Used:**

> Add `frontend/src/services/api.js` (Axios, relative `/api` paths) and `frontend/src/services/metrics.js`.
>
> Conversion rate must be calculated on the frontend: add-to-carts / views. If views is 0, return null so the UI can show an em dash instead of `0%`.
>
> Simulate Traffic needs a weighted random event type: view 70% / click 20% / add_to_cart 10%. Format money from integer cents. No Tailwind — I'll style with CSS Modules next.

**Outcome & Adjustments:** Helpers matched the brief. Axios unwraps `response.data` and surfaces `error.message` from the API envelope. Relative `/api` paths depend on the Vite proxy (missing until entry 8). I did not put conversion rate in SQL.

---

## 6. Dashboard layout, table, pagination, Simulate Traffic

**Tool Used:** Cursor IDE

**Context/Task:** Build the merchant dashboard: metrics table, conversion-rate column, pagination, and a Simulate Traffic button that POSTs `/api/events` then refreshes.

**Exact Prompt Used:**

> Build a clean, responsive merchant dashboard in React (CSS Modules, semantic HTML, no Tailwind):
>
> - Fetch `GET /api/analytics/videos` and show a table: video, product, views, clicks, conversions (add-to-carts), conversion rate.
> - Conversion rate column: `addToCart / views` using `metrics.js`.
> - Pagination from the API `pagination` object (10 per page).
> - KPI cards using storewide `totals` (not the current page).
> - Simulate Traffic button: pick a random video from `GET /api/videos` (fallback to the current page), POST a weighted random event to `/api/events`, then refetch the table.
>
> Keep components split: `AnalyticsTable`, `Pagination`, `SimulateTrafficButton`, page in `pages/Dashboard.jsx`.

**Outcome & Adjustments:** Layout, table, pagination, and the button shipped in separate commits. Conversion rate stays in the browser. Simulate Traffic uses the full catalog so page 2 videos can receive events. Styling is CSS Modules only.

---

## 7. How to run the frontend

**Tool Used:** Cursor IDE

**Context/Task:** Confirm local start commands after scaffolding (frontend was still the Vite starter at this point).

**Exact Prompt Used:**

> how to run the frontend here?

**Outcome & Adjustments:** Confirmed `cd frontend && npm install && npm run dev` → http://localhost:5173. Backend is a separate process (`cd backend && npm run seed && npm run dev`). No code change.

---

## 8. Debug: `Cannot read properties of undefined (reading 'addToCart')`

**Tool Used:** Cursor IDE

**Context/Task:** Dashboard crashed on load when reading `totals.addToCart`.

**Exact Prompt Used:**

> why frontend is failing with the below error?
> Dashboard.jsx:74 Uncaught TypeError: Cannot read properties of undefined (reading 'addToCart')
>     at Dashboard.jsx:74:33
>     at Dashboard (Dashboard.jsx:73:21

**Outcome & Adjustments:** Not a bug in `conversionRate`. `totals` starts as `{ views: 0, clicks: 0, addToCart: 0 }`, then `loadAnalytics` sets `result.totals` from `GET /api/analytics/videos`. Axios used a relative `/api` URL; Vite had **no proxy**, so Vite returned `index.html`. Axios treated that as success, `totals` became `undefined`, and the next render crashed.
>
> The Express endpoint itself was fine (`curl` to `:4000` returned JSON with `totals`). I added a Vite `server.proxy` for `/api` → `http://localhost:4000` in `frontend/vite.config.js`. After that, the proxied response included `{ data, totals, pagination }`.

---

## 9. README: structure, stack, and how to run

**Tool Used:** Cursor IDE

**Context/Task:** Replace a draft README that assumed a root npm workspace with docs that match this repo.

**Exact Prompt Used:**

> modify the readme file according to the project structure, instuction to start the project & used tech stack and all.

**Outcome & Adjustments:** README now documents two packages, Prisma seed/migrate, ports 4000 / 5173, env vars, API shapes, and schema. I later aligned it further with the assignment submission rules (entry 10).

---

## 10. README aligned to the assignment brief

**Tool Used:** Cursor IDE

**Context/Task:** Make README.md a submission document, not only a setup guide — required links, public repos, stack constraints, and a requirements checklist.

**Exact Prompt Used:**

> [Full Videoselz Take-Home Project — Aug 2026 brief pasted]
>
> This is the assignment doc. Make sure The readme.md file is aligned with is doc

**Outcome & Adjustments:** Added submission table (repo, 30s YouTube pitch placeholder, 3–5 min walkthrough placeholder, this file), public GitHub projects, and a requirements → implementation table. Pitch and Loom URLs are still placeholders until recorded.

---

## 11. This prompting log

**Tool Used:** Cursor IDE

**Context/Task:** Fill `AI_PROMPTING.md` per section 4 of the brief (tool, context, exact prompt, outcome).

**Exact Prompt Used:**

> Add a sample ai prompt detail according to the below doc
>
> [Full Videoselz Take-Home Project — Aug 2026 brief pasted, including section 4: AI Collaboration & Prompt Engineering Log]

**Outcome & Adjustments:** This file. Entries 7–11 use the actual Cursor chat text. Entries 1–6 reconstruct the major feature prompts that produced the schema, APIs, and dashboard (those commits predate the saved chat transcripts). Autocomplete and one-line edits are not logged.
