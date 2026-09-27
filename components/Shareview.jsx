"use client";

import { useState } from "react";
import GameCard from "./GameCard.jsx";
import DetailPanel from "./DetailPanel.jsx";
import { useResizableSidebar } from "../lib/useResizableSidebar.js";

export default function ShareView({ selectedGames, recommendations, missingCount = 0 }) {
  const [focusedGame, setFocusedGame] = useState(null);
  const [fetchingGameName, setFetchingGameName] = useState(null);

  const {
    sidebarGame,
    sidebarOpen,
    sidebarWidth,
    isResizing,
    handleResizeStart,
    handleResizeKeyDown,
    MIN_SIDEBAR_WIDTH,
    MAX_SIDEBAR_WIDTH,
  } = useResizableSidebar(focusedGame);

  // Cards here only carry the lightweight summary (see getGameSummary), so
  // opening one fetches the full detail box the same way the main page's
  // search flow does — reusing /api/games/:id (and its rate limiting).
  async function handleOpen(summary) {
    setFetchingGameName(summary.name);
    try {
      const res = await fetch(`/api/games/${summary.id}`);
      if (!res.ok) throw new Error("Could not load game details");
      const details = await res.json();
      setFocusedGame({
        ...details,
        reason: summary.reason,
        suggestedAs: summary.suggestedAs,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingGameName(null);
    }
  }

  return (
    <div className="flex items-start">
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-20">
          <section className="mb-10">
            <p className="text-sm font-medium uppercase tracking-wide text-marigold-500">
              Shared recommendations
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-parchment-100 sm:text-4xl">
              Someone's GameNet results
            </h1>
            <p className="mt-3 max-w-[60ch] text-parchment-300">
              These are the games they picked and what GameNet recommended
              back. Click any card for the full details.
            </p>
            {fetchingGameName && (
              <p className="mt-2 text-sm text-parchment-500">
                Fetching {fetchingGameName}'s details…
              </p>
            )}
          </section>

          <section className="mb-10">
            <h2 className="mb-3 font-display text-lg font-medium text-parchment-100">
              Games they picked
            </h2>
            {selectedGames.length === 0 ? (
              <p className="text-parchment-500">
                None of the original games could be loaded — they may have
                been removed from RAWG since this link was made.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {selectedGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onClick={() => handleOpen(game)}
                  />
                ))}
              </div>
            )}
          </section>

          {focusedGame && (
            <section className="mb-10 md:hidden">
              <DetailPanel
                game={focusedGame}
                onClose={() => setFocusedGame(null)}
              />
            </section>
          )}

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-medium text-parchment-100">
                What GameNet recommended
              </h2>
              {missingCount > 0 && (
                <span className="text-sm text-parchment-500">
                  {missingCount} recommendation{missingCount === 1 ? "" : "s"}{" "}
                  could no longer be found on RAWG
                </span>
              )}
            </div>

            {recommendations.length === 0 ? (
              <p className="text-parchment-500">
                No recommendations could be loaded for this link.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {recommendations.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    reason={game.reason}
                    onClick={() => handleOpen(game)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {sidebarGame && (
        <aside
          className={`sticky top-[57px] hidden h-[calc(100vh-57px)] shrink-0 overflow-hidden border-l border-ink-700 bg-ink-950 md:block ${
            isResizing ? "" : "transition-[width] duration-300 ease-in-out"
          }`}
          style={{ width: sidebarOpen ? `${sidebarWidth}px` : 0 }}
        >
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize detail panel"
            aria-valuenow={Math.round(sidebarWidth)}
            aria-valuemin={MIN_SIDEBAR_WIDTH}
            aria-valuemax={MAX_SIDEBAR_WIDTH}
            tabIndex={0}
            onMouseDown={handleResizeStart}
            onKeyDown={handleResizeKeyDown}
            className="group absolute inset-y-0 left-0 z-10 hidden w-2.5 -translate-x-1/2 cursor-col-resize touch-none md:block"
          >
            <div className="mx-auto h-full w-px bg-transparent transition-colors group-hover:bg-marigold-500 group-focus-visible:bg-marigold-500 group-active:bg-marigold-500" />
          </div>

          <div
            className="h-full overflow-y-auto p-5"
            style={{ width: `${sidebarWidth}px` }}
          >
            <DetailPanel
              game={sidebarGame}
              onClose={() => setFocusedGame(null)}
              compact
            />
          </div>
        </aside>
      )}
    </div>
  );
}