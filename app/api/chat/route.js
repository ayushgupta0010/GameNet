import { NextResponse } from "next/server";
import { getChatReply } from "../../../lib/gemini.js";
import { rateLimit } from "../../../lib/rateLimit.js";

const MAX_MESSAGE_LENGTH = 1000;

// Looser window than /recommend (a real conversation sends many small
// messages) but still bounded, since each call is a Gemini request.
export async function POST(request) {
  const limited = rateLimit(request, { windowMs: 60_000, max: 30, bucket: "chat" });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many messages, slow down a moment." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { message, history } = body || {};

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "`message` is required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)` },
      { status: 400 }
    );
  }

  try {
    const reply = await getChatReply(Array.isArray(history) ? history : [], message.trim());
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json(
      { error: "Failed to get a response from the chatbot", detail: err.message },
      { status: 502 }
    );
  }
}