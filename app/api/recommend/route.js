import { NextResponse } from "next/server";
import { getSimilarGames } from "../../../lib/gemini.js";
import { findBestMatch, getGameDetails } from "../../../lib/rawg.js";
import { rateLimit } from "../../../lib/rateLimit.js";

// Tighter limit than search/details: each call fans out into one Gemini
// request plus up to ~20 RAWG lookups.
export async function POST(request) {
  const limited = rateLimit(request, { windowMs: 60_000, max: 10, bucket: "recommend" });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests, slow down." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { games, count = 20 } = body || {};

  if (!Array.isArray(games) || games.length === 0) {
    return NextResponse.json(
      { error: "Provide at least one game in `games`" },
      { status: 400 }
    );
  }
  if (games.length > 5) {
    return NextResponse.json(
      { error: "Maximum of 5 input games allowed" },
      { status: 400 }
    );
  }

  try {
    const suggestions = await getSimilarGames(games, count);

    if (suggestions.length === 0) {
      return NextResponse.json({ recommendations: [], unresolvedCount: 0 });
    }

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

    return NextResponse.json({ recommendations, unresolvedCount });
  } catch (err) {
    console.error("[/api/recommend]", err);
    return NextResponse.json(
      { error: "Failed to generate recommendations", detail: err.message },
      { status: 502 }
    );
  }
}
