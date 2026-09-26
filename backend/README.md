# Game Recommender — Backend Proxy

Proxies RAWG (search + metadata) and Gemini (similar-game generation) so API
keys never reach the browser, and stitches Gemini's suggestions back into
full RAWG metadata boxes.

## Setup

```bash
npm install
cp .env.example .env
# then fill in RAWG_API_KEY and GEMINI_API_KEY in .env
npm run dev
```

Server runs on `http://localhost:3001` by default.

## Endpoints

### `GET /api/games/search?q=zelda`
Autocomplete search. Returns lightweight results for a dropdown.

```json
{ "results": [ { "id": 22511, "name": "Zelda II: The Adventure of Link", "slug": "...", "backgroundImage": "...", "rating": 3.7, "metacritic": 75, "genres": ["Action", "Adventure"] } ] }
```

### `GET /api/games/:id`
Full metadata-box payload for one game (name, image, genres, ratings,
description, platforms, trailer URL if available).

### `POST /api/recommend`
Body:
```json
{
  "games": [
    { "name": "Hollow Knight", "genres": ["Platformer"], "tags": ["Metroidvania"], "description": "..." }
  ],
  "count": 20
}
```
- `games`: 1–5 games the user selected. Pass along whatever metadata you
  already have from the metadata box (genres/tags/description) — it
  meaningfully improves Gemini's recommendations.
- `count`: optional, how many suggestions to request from Gemini (default 20).
  The final `recommendations` array may be shorter, since titles that don't
  resolve to a confident RAWG match are dropped (see `unresolvedCount`).

Response:
```json
{
  "recommendations": [
    { "id": 123, "name": "...", "backgroundImage": "...", "reason": "...", "suggestedAs": "...", "...": "full metadata box fields" }
  ],
  "unresolvedCount": 2
}
```

## Design notes

- **Structured output**: Gemini is called with `responseSchema` +
  `responseMimeType: application/json`, so the response is guaranteed valid
  JSON in the exact shape expected — no prompt-engineered "please return
  JSON only" fragility.
- **Name resolution**: Gemini returns titles, not RAWG ids (it doesn't know
  RAWG's internal ids). Each title is searched against RAWG and matched
  exactly if possible, otherwise RAWG's top-ranked fuzzy result is used.
  Titles that don't resolve at all are dropped rather than failing the
  request.
- **Caching**: RAWG responses are cached in-memory for 6 hours to reduce
  redundant calls (the resolve-20-titles step is the most request-heavy
  part of the flow). Swap `NodeCache` for Redis if you scale to multiple
  server instances.
- **Rate limiting**: `/api/recommend` is limited more tightly than
  `/api/games/*` since each call fans out into a Gemini request plus up to
  ~20 RAWG lookups.

## Next steps

- Wire a frontend to these three endpoints (search box + chips + metadata
  boxes + generate button).
- Consider persisting the cache (Redis/SQLite) if you deploy to a
  serverless platform where memory doesn't persist between invocations.