import { Router } from "express";
import { searchGames, getGameDetails } from "../services/rawg.js";

const router = Router();

// GET /api/games/search?q=zelda
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q?.toString() || "";
    const results = await searchGames(q);
    res.json({ results });
  } catch (err) {
    console.error("[/api/games/search]", err);
    res.status(502).json({ error: "Failed to search games", detail: err.message });
  }
});

// GET /api/games/:id  -> full metadata box payload
router.get("/:id", async (req, res) => {
  try {
    const game = await getGameDetails(req.params.id);
    res.json(game);
  } catch (err) {
    console.error("[/api/games/:id]", err);
    res.status(502).json({ error: "Failed to fetch game details", detail: err.message });
  }
});

export default router;
