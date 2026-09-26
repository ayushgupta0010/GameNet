# Shelfmix — Next.js game recommender

A single Next.js app: the frontend (App Router pages) and the backend proxy
(Route Handlers) that previously lived in the separate Express server now
live together. Same RAWG + Gemini logic, same API contract — just one
project instead of two.

## Setup

```bash
npm install
cp .env.example .env.local
# fill in RAWG_API_KEY and GEMINI_API_KEY
npm run dev
```

Visit `http://localhost:3000`.

## How it's organized

```
app/
  page.js                 the whole UI (search, shelf, detail panel, results)
  layout.js                fonts + global shell
  globals.css               Tailwind + a few base styles
  api/
    games/search/route.js   GET  /api/games/search?q=   → RAWG autocomplete
    games/[id]/route.js     GET  /api/games/:id          → full metadata box
    recommend/route.js      POST /api/recommend          → Gemini + RAWG resolve
components/
  SearchBar.jsx              debounced autocomplete input
  GameCard.jsx                compact card (shelf strip + recommendations grid)
  DetailPanel.jsx             large focused metadata box, with trailer
lib/
  rawg.js                    RAWG fetch + cache, same as the Express version
  gemini.js                  Gemini structured-output call, same as before
  rateLimit.js                minimal in-memory limiter for the route handlers
```

Because API keys are only ever read inside `lib/` (server-side code called
from Route Handlers), they never reach the browser — same guarantee the
Express proxy gave you.

## App flow

1. Type in the search bar → debounced call to `/api/games/search`.
2. Pick a result → `/api/games/:id` fetches the full metadata box (image,
   genres, ratings, description, trailer) and adds it to "Your shelf" (max 5).
3. Click "Generate recommendations" → `/api/recommend` asks Gemini for
   similar titles (structured JSON output) and resolves each one back to a
   RAWG record, dropping any that don't match confidently.
4. Recommendations render in the same card style, each with a one-line
   reason from Gemini. Clicking any card (shelf or recommendation) opens it
   in the large detail panel.

## Design notes

- Palette and type are defined once as Tailwind tokens in
  `tailwind.config.js` (`ink`, `parchment`, `marigold`, `teal`, `clay`) —
  change them there rather than hunting through components.
- `DetailPanel` truncates long descriptions at 500 characters; adjust in
  `components/DetailPanel.jsx` if you want the full RAWG text.
- The in-memory cache (`lib/rawg.js`) and rate limiter (`lib/rateLimit.js`)
  work great on a persistent Node server (`npm start`). On serverless
  hosting (Vercel, etc.) each function instance keeps its own state, so
  caching/limiting is looser but nothing breaks — swap in Redis if you need
  hard guarantees at scale.

## Deploying

Works on any Next.js host. On Vercel: push to a repo, import it, and set
`RAWG_API_KEY` / `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) as
environment variables in the project settings.
