"use client";

import { useEffect, useRef, useState } from "react";
import SearchBar from "../components/SearchBar.jsx";
import GameCard from "../components/GameCard.jsx";
import DetailPanel from "../components/DetailPanel.jsx";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

const MAX_GAMES = 5;
const SIDEBAR_TRANSITION_MS = 300;

export default function Home() {
  const [selectedGames, setSelectedGames] = useState([]);
  const [focusedGame, setFocusedGame] = useState(null);
  const [fetchingGameName, setFetchingGameName] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const [sidebarGame, setSidebarGame] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    if (focusedGame) {
      clearTimeout(closeTimeoutRef.current);
      setSidebarGame(focusedGame);
      // Two rAFs so the browser paints the closed (0-width) state first,
      // then the width transition actually has something to animate from.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setSidebarOpen(true)),
      );
    } else {
      setSidebarOpen(false);
      closeTimeoutRef.current = setTimeout(
        () => setSidebarGame(null),
        SIDEBAR_TRANSITION_MS,
      );
    }
    return () => clearTimeout(closeTimeoutRef.current);
  }, [focusedGame]);

  async function handleSelectFromSearch(summary) {
    if (selectedGames.length >= MAX_GAMES) return;
    if (selectedGames.some((g) => g.id === summary.id)) return;

    setFetchingGameName(summary.name);
    try {
      const res = await fetch(`/api/games/${summary.id}`);
      if (!res.ok) throw new Error("Could not load game details");
      const details = await res.json();
      setSelectedGames((prev) => [...prev, details]);
      setFocusedGame(details);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingGameName(null);
    }
  }

  function handleRemove(id) {
    setSelectedGames((prev) => prev.filter((g) => g.id !== id));
    setFocusedGame((prev) => (prev?.id === id ? null : prev));
  }

  async function handleGenerate() {
    if (selectedGames.length === 0) return;
    setGenerating(true);
    setGenerateError(null);
    setRecommendations([]);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          games: selectedGames.map((g) => ({
            name: g.name,
            genres: g.genres,
            tags: g.tags,
            description: g.description,
          })),
          count: 20,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setRecommendations(data.recommendations || []);
      setUnresolvedCount(data.unresolvedCount || 0);
    } catch (err) {
      setGenerateError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <Navbar
        selectedCount={selectedGames.length}
        maxGames={MAX_GAMES}
        generating={generating}
        onGenerate={handleGenerate}
      />

      <div className="flex items-start">
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-5 py-12 sm:py-20">
            {/* Hero */}
            <section className="mb-10">
              <h1 className="font-display text-4xl font-bold leading-tight text-parchment-100 sm:text-5xl">
                Find Your Next Favorite Game!
              </h1>
              <p className="mt-3 max-w-[60ch] text-parchment-300">
                Add up to 5 games that you enjoy to receive recommendations on
                similar games!
              </p>
            </section>

            {/* Search */}
            <section className="mb-8">
              <SearchBar
                onSelect={handleSelectFromSearch}
                disabled={selectedGames.length >= MAX_GAMES}
              />
              {fetchingGameName && (
                <p className="mt-2 text-sm text-parchment-500">
                  Fetching {fetchingGameName}'s details…
                </p>
              )}
            </section>

            {/* selected-games */}
            <section className="mb-10">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-display text-lg font-medium text-parchment-100">
                  Games Selected
                </h2>
                <span className="text-sm text-parchment-500">
                  {selectedGames.length}/{MAX_GAMES}
                </span>
              </div>

              {selectedGames.length === 0 ? (
                <div className="rounded-card border border-dashed border-ink-600 px-5 py-8 text-center text-parchment-500">
                  Nothing here yet — search above to add the first game.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {selectedGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      onClick={() => setFocusedGame(game)}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              )}

              {generateError && (
                <p className="mt-3 text-sm text-clay-500">
                  Couldn't generate recommendations: {generateError}
                </p>
              )}
            </section>

            {/* Focused detail panel — shown inline only on narrow screens,
                where there's no room to push a sidebar over. On md+ it
                renders in the sidebar to the right instead (see below). */}
            {focusedGame && (
              <section className="mb-10 md:hidden">
                <DetailPanel
                  game={focusedGame}
                  onClose={() => setFocusedGame(null)}
                />
              </section>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <section>
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="font-display text-lg font-medium text-parchment-100">
                    Recommended for you!
                  </h2>
                  {unresolvedCount > 0 && (
                    <span className="text-sm text-parchment-500">
                      {unresolvedCount} suggestion
                      {unresolvedCount === 1 ? "" : "s"} couldn't be matched to
                      a RAWG listing
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {recommendations.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      reason={game.reason}
                      onClick={() => setFocusedGame(game)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Sidebar detail panel — pushes the main column over instead of
            floating on top of it. Width (not just transform) is what
            animates, so the push and the slide happen in sync. Hidden on
            narrow screens (see the inline version above) since there's no
            room to push content sideways. */}
        {sidebarGame && (
          <aside
            className={`sticky top-[57px] hidden h-[calc(100vh-57px)] shrink-0 overflow-hidden border-l border-ink-700 bg-ink-950 transition-[width] duration-300 ease-in-out md:block ${
              sidebarOpen ? "md:w-[420px]" : "md:w-0"
            }`}
          >
            <div className="h-full w-[420px] overflow-y-auto p-5">
              <DetailPanel
                game={sidebarGame}
                onClose={() => setFocusedGame(null)}
                compact
              />
            </div>
          </aside>
        )}
      </div>

      <Footer />
    </>
  );
}
