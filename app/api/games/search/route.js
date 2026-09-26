import { NextResponse } from "next/server";
import { searchGames } from "../../../../lib/rawg.js";
import { rateLimit } from "../../../../lib/rateLimit.js";

export async function GET(request) {
  const limited = rateLimit(request, { windowMs: 60_000, max: 60, bucket: "search" });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests, slow down." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const q = new URL(request.url).searchParams.get("q") || "";

  try {
    const results = await searchGames(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[/api/games/search]", err);
    return NextResponse.json(
      { error: "Failed to search games", detail: err.message },
      { status: 502 }
    );
  }
}
