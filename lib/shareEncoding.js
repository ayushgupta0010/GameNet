// Encodes/decodes the compact payload used for shareable result links.
//
// Deliberately stores only RAWG ids (plus the Gemini-generated reason text)
// rather than full game objects — descriptions, screenshots, and trailer
// URLs would blow the link up to tens of KB for no benefit. The share page
// re-resolves each id back to a full game record server-side, reusing the
// same RAWG cache the rest of the app already has.
//
// Written without Node's Buffer so the same functions work both in the
// browser (building the link on the results page) and on the server
// (decoding it in the share page's Server Component).

const SHARE_PAYLOAD_VERSION = 1;

function toBase64Url(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  const base64 =
    typeof window !== "undefined"
      ? window.btoa(binary)
      : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(base64url) {
  const padded = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const base64 = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  const binary =
    typeof window !== "undefined"
      ? window.atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/**
 * @param {{ input: number[], recs: Array<{ id: number, reason?: string, as?: string }> }} data
 * @returns {string} a URL-safe token, suitable for a path segment
 */
export function encodeSharePayload({ input, recs }) {
  const payload = { v: SHARE_PAYLOAD_VERSION, input, recs };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return toBase64Url(bytes);
}

/**
 * @param {string} token
 * @returns {{ input: number[], recs: Array<{ id: number, reason?: string, as?: string }> }}
 * @throws if the token can't be decoded or doesn't match the expected shape
 */
export function decodeSharePayload(token) {
  const bytes = fromBase64Url(token);
  const payload = JSON.parse(new TextDecoder().decode(bytes));

  if (
    !payload ||
    payload.v !== SHARE_PAYLOAD_VERSION ||
    !Array.isArray(payload.input) ||
    !Array.isArray(payload.recs)
  ) {
    throw new Error("Unrecognized share payload shape");
  }

  return payload;
}