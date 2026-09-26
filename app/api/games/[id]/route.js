import { NextResponse } from "next/server";
import { getGameDetails } from "../../../../lib/rawg.js";
import { rateLimit } from "../../../../lib/rateLimit.js";

export async function GET(request, { params }) {
  const limited = rateLimit(request, { windowMs: 60_000, max: 60, bucket: "details" });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests, slow down." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  try {
    const game = await getGameDetails(params.id);
    return NextResponse.json(game);
  } catch (err) {
    console.error("[/api/games/:id]", err);
    return NextResponse.json(
      { error: "Failed to fetch game details", detail: err.message },
      { status: 502 }
    );
  }
}
