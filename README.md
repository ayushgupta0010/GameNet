# GameNet — Find similar games to the ones you like!

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
  page.js                 the whole UI (search, selected-games, detail panel, results)
  layout.js                fonts + global shell
  globals.css               Tailwind + a few base styles
  api/
    games/search/route.js   GET  /api/games/search?q=   → RAWG autocomplete
    games/[id]/route.js     GET  /api/games/:id          → full metadata box
    recommend/route.js      POST /api/recommend          → Gemini + RAWG resolve
components/
  SearchBar.jsx              debounced autocomplete input
  GameCard.jsx                compact card (selected-games strip + recommendations grid)
  DetailPanel.jsx             large focused metadata box, with trailer
lib/
  rawg.js                    RAWG fetch + cache, same as the Express version
  gemini.js                  Gemini structured-output call, same as before
  rateLimit.js                minimal in-memory limiter for the route handlers
```

## App flow

1. Type in the search bar → debounced call to `/api/games/search`.
2. Pick a result → `/api/games/:id` fetches the full metadata box (image,
   genres, ratings, description, trailer) and adds it to "Your selected-games" (max 5).
3. Click "Generate recommendations" → `/api/recommend` asks Gemini for
   similar titles (structured JSON output) and resolves each one back to a
   RAWG record, dropping any that don't match confidently.
4. Recommendations render in the same card style, each with a one-line
   reason from Gemini. Clicking any card (selected-games or recommendation) opens it
   in the large detail panel.
