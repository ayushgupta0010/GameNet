const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Schema constrains Gemini to return exactly the shape we need, so we don't
// have to defensively parse free-text JSON out of a chat-style response.
const RECOMMENDATION_SCHEMA = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The exact, real title of a recommended video game.",
          },
          reason: {
            type: "string",
            description: "One short sentence briefly describing the game and why it fits the input games. Keep the sentence basic and specific. Be sure to reference the games' titles - never just say 'It.'",
          },
        },
        required: ["name", "reason"],
      },
    },
  },
  required: ["recommendations"],
};

function requireApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set in the environment");
  }
  return key;
}

/**
 * Ask Gemini for games similar to the given list, using structured output
 * so the response is guaranteed-parseable JSON rather than free text.
 *
 * @param {Array<{name: string, genres?: string[], tags?: string[], description?: string}>} games
 * @param {number} count - how many recommendations to request
 */
export async function getSimilarGames(games, count = 20) {
  const apiKey = requireApiKey();
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const gameDescriptions = games
    .map((g, i) => {
      const bits = [`${i + 1}. ${g.name}`];
      if (g.genres?.length) bits.push(`Genres: ${g.genres.join(", ")}`);
      if (g.tags?.length) bits.push(`Tags: ${g.tags.slice(0, 6).join(", ")}`);
      if (g.description) bits.push(`Description: ${g.description.slice(0, 300)}`);
      return bits.join("\n   ");
    })
    .join("\n\n");

  const prompt = `You are a video game recommendation engine.

A user has selected these games:

${gameDescriptions}

Recommend up to ${count} other real, existing video games that fans of the
games above would likely enjoy, based on genre, mechanics, tone, and themes.

Rules:
- Only include real, released or announced video games that actually exist.
- Do not include any of the input games themselves.
- Do not include duplicate titles.
- Use each game's most commonly recognized title (the one it would be
  listed under in a game database), not a nickname or abbreviation.`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RECOMMENDATION_SCHEMA,
      temperature: 0.6,
    },
  };

  const res = await fetch(
    `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no content");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini response was not valid JSON despite responseSchema");
  }

  const recs = parsed.recommendations || [];
  const inputNames = new Set(games.map((g) => g.name.trim().toLowerCase()));
  const seen = new Set();
  return recs.filter((r) => {
    const key = r.name?.trim().toLowerCase();
    if (!key || inputNames.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
