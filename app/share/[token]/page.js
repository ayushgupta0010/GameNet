import Link from "next/link";
import Footer from "../../../components/Footer.jsx";
import { getGameSummary } from "../../../lib/rawg.js";
import { decodeSharePayload } from "../../../lib/shareEncoding.js";
import ShareView from "../../../components/ShareView";

// Every share link is unique per token, so there's nothing useful to
// prerender at build time, and we want each visit to re-check RAWG (via
// our own cached rawgFetch) rather than being frozen by Next's own
// full-route cache.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shared recommendations — GameNet",
  description:
    "See what GameNet recommended based on someone else's favorite games.",
};

export default async function SharePage({ params }) {
  let payload = null;
  try {
    payload = decodeSharePayload(params.token);
  } catch (err) {
    console.error("[/share] failed to decode token", err);
  }

  if (!payload) {
    return <InvalidLink />;
  }

  const [inputResults, recResults] = await Promise.all([
    Promise.allSettled(payload.input.map((id) => getGameSummary(id))),
    Promise.allSettled(
      payload.recs.map(async (rec) => {
        const summary = await getGameSummary(rec.id);
        if (!summary) return null;
        return { ...summary, reason: rec.reason, suggestedAs: rec.as };
      }),
    ),
  ]);

  const selectedGames = inputResults
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

  const recommendations = recResults
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);

  const missingCount = payload.recs.length - recommendations.length;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-ink-700 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link
            href="/"
            className="font-display text-lg font-bold text-parchment-100"
          >
            GameNet
          </Link>
          <Link
            href="/"
            className="rounded-card bg-marigold-500 px-4 py-2 font-display text-sm font-medium text-ink-950 transition-colors hover:bg-marigold-400"
          >
            Try your own picks
          </Link>
        </div>
      </header>

      <ShareView
        selectedGames={selectedGames}
        recommendations={recommendations}
        missingCount={missingCount}
      />

      <Footer />
    </>
  );
}

function InvalidLink() {
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="font-display text-2xl font-bold text-parchment-100">
        This link looks broken
      </h1>
      <p className="mt-3 text-parchment-300">
        We couldn't read the shared results — the link may be incomplete or
        corrupted.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-marigold-500 hover:text-marigold-400"
      >
        ← Back to GameNet
      </Link>
    </div>
  );
}