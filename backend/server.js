import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import gamesRouter from "./routes/games.js";
import recommendRouter from "./routes/recommend.js";

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json());

// Generous general limit for search/details (users type-to-search a lot),
// tighter limit on /api/recommend since each call costs a Gemini request
// plus up to ~20 RAWG lookups.
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
const recommendLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

app.use("/api/games", generalLimiter, gamesRouter);
app.use("/api/recommend", recommendLimiter, recommendRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Game recommender backend listening on http://localhost:${port}`);
});
