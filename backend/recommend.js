import { Router } from "express";
import { getSimilarGames } from "../services/gemini.js";
import { findBestMatch, getGameDetails } from "../services/rawg.js";

const router = Router();

// POST /api/recommend
// body: { games: [{ name, genres, tags, description }], count?: number }
//
// 1. Ask Gemini for similar titles (structured JSON output).
// 2. Resolve each title to a RAWG record.
// 3. Fetch full metadata-box details for whatever resolved.
// Games that don't resolve to a confident RAWG match are silently dropped
// rather than failing the whole request.
router.post("/", async (req, res) => {
  try {
    const { games, count = 20 } = req.body || {};

    if (!Array.isArray(games) || games.length === 0) {
      return res.status(400).json({ error: "Provide at least one game in `games`" });
    }
    if (games.length > 5) {
      return res.status(400).json({ error: "Maximum of 5 input games allowed" });
    }

    const suggestions = await getSimilarGames(games, count);

    if (suggestions.length === 0) {
      return res.json({ recommendations: [] });
    }

    // Resolve each suggested name to a RAWG game id, in parallel.
    const matches = await Promise.allSettled(
      suggestions.map(async (s) => {
        const match = await findBestMatch(s.name);
        if (!match) return null;
        const details = await getGameDetails(match.id);
        return { ...details, reason: s.reason, suggestedAs: s.name };
      })
    );

    const recommendations = matches
      .filter((m) => m.status === "fulfilled" && m.value)
      .map((m) => m.value);

    const unresolvedCount = suggestions.length - recommendations.length;

    res.json({ recommendations, unresolvedCount });
  } catch (err) {
    console.error("[/api/recommend]", err);
    res.status(502).json({ error: "Failed to generate recommendations", detail: err.message });
  }
});

export default router;
