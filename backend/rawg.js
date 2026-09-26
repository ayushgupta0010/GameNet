import NodeCache from "node-cache";

const RAWG_BASE = "https://api.rawg.io/api";

// Cache search results and game details in memory. TTLs are generous because
// game metadata rarely changes. Swap this for Redis if you run multiple
// server instances.
const cache = new NodeCache({ stdTTL: 60 * 60 * 6 }); // 6 hours

function requireApiKey() {
  const key = process.env.RAWG_API_KEY;
  if (!key) {
    throw new Error("RAWG_API_KEY is not set in the environment");
  }
  return key;
}

async function rawgFetch(path, params = {}) {
  const key = requireApiKey();
  const url = new URL(`${RAWG_BASE}${path}`);
  url.searchParams.set("key", key);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, v);
    }
  }

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`RAWG request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  cache.set(cacheKey, data);
  return data;
}

/**
 * Autocomplete-style search. Returns a lightweight list for a dropdown.
 */
export async function searchGames(query, pageSize = 6) {
  if (!query || !query.trim()) return [];
  const data = await rawgFetch("/games", {
    search: query,
    page_size: pageSize,
  });
  return (data.results || []).map(summarize);
}

/**
 * Find the single best RAWG match for a free-text game name.
 * Used to resolve Gemini's recommended titles back to real RAWG records.
 * Returns null if nothing reasonable is found.
 */
export async function findBestMatch(name) {
  if (!name || !name.trim()) return null;
  const data = await rawgFetch("/games", {
    search: name,
    page_size: 5,
  });
  const results = data.results || [];
  if (results.length === 0) return null;

  // Prefer an exact (case-insensitive) name match; otherwise take RAWG's
  // top-ranked fuzzy result, since RAWG already sorts by relevance.
  const normalized = name.trim().toLowerCase();
  const exact = results.find((g) => g.name.trim().toLowerCase() === normalized);
  return summarize(exact || results[0]);
}

/**
 * Full metadata box payload for a single game, including a trailer if RAWG
 * has one indexed.
 */
export async function getGameDetails(id) {
  const [details, movies] = await Promise.all([
    rawgFetch(`/games/${id}`),
    rawgFetch(`/games/${id}/movies`).catch(() => ({ results: [] })),
  ]);

  const trailer = movies.results?.[0]?.data
    ? movies.results[0].data.max || movies.results[0].data[480]
    : null;

  return {
    id: details.id,
    name: details.name,
    slug: details.slug,
    released: details.released,
    backgroundImage: details.background_image,
    description: details.description_raw,
    rating: details.rating,
    ratingTop: details.rating_top,
    metacritic: details.metacritic,
    genres: (details.genres || []).map((g) => g.name),
    tags: (details.tags || []).slice(0, 10).map((t) => t.name),
    platforms: (details.platforms || []).map((p) => p.platform.name),
    esrbRating: details.esrb_rating?.name || null,
    website: details.website || null,
    trailerUrl: trailer,
  };
}

function summarize(game) {
  return {
    id: game.id,
    name: game.name,
    slug: game.slug,
    released: game.released,
    backgroundImage: game.background_image,
    rating: game.rating,
    metacritic: game.metacritic,
    genres: (game.genres || []).map((g) => g.name),
  };
}
