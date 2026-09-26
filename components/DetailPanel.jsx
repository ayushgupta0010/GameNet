"use client";

import ShuffleCarousel from "./Screenshots";

import { useEffect, useState } from "react";

const DESCRIPTION_PREVIEW_LENGTH = 500;

export default function DetailPanel({ game, onClose, compact = false }) {
  const [screenshots, setScreenshots] = useState(game?.screenshots);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setScreenshots(game?.screenshots);
  }, [game?.screenshots]);

  // Reset the read-more state whenever a different game is focused, so a
  // previously-expanded description doesn't stay expanded for the next game.
  useEffect(() => {
    setExpanded(false);
  }, [game?.id]);

  if (!game) return null;

  const description = game.description || "";
  const isLong = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const shownDescription =
    isLong && !expanded
      ? `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trim()}…`
      : description;

  return (
    <div className="overflow-hidden rounded-card border border-ink-700 bg-ink-900">
      <div className="relative h-56 w-full bg-ink-800 sm:h-72">
        {game.backgroundImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.backgroundImage}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />


        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close details"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/70 text-parchment-100 hover:bg-ink-950"
          >
            ×
          </button>
        )}

        <div className="absolute bottom-0 left-0 p-5">
          <h2 className="font-display text-2xl font-bold text-parchment-100 sm:text-3xl">
            {game.name}
          </h2>
          <p className="mt-1 text-sm text-parchment-300">
            {game.released ? new Date(game.released).getFullYear() : "TBA"}
            {game.developerName ? ` · ${game.developerName}` : ""}
            {game.esrbRating ? ` · ${game.esrbRating}` : ""}
          </p>
        </div>
      </div>

      <div
        className={`grid gap-5 p-5 ${!compact && game.trailerUrl ? "md:grid-cols-[1.3fr_1fr]" : "grid-cols-1"
          }`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {game.rating > 0 && (
              <Badge label={`★ ${game.rating.toFixed(1)} RAWG`} tone="marigold" />
            )}
            {game.metacritic && <Badge label={`${game.metacritic} Metacritic`} tone="teal" />}
          </div>

          {game.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {game.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-card bg-teal-500/15 px-2.5 py-1 text-xs text-teal-400"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {description && (
            <div className="max-w-[70ch]">
              <p className="text-sm leading-relaxed text-parchment-300">
                {shownDescription}
              </p>
              {isLong && (
                <button
                  onClick={() => setExpanded((prev) => !prev)}
                  className="mt-1.5 text-sm font-medium text-marigold-500 hover:text-marigold-400"
                >
                  {expanded ? "Read less" : "Read more"}
                </button>
              )}
            </div>
          )}

          <ShuffleCarousel images={screenshots} />

          {game.platforms?.length > 0 && (
            <p className="text-xs text-parchment-500">
              Platforms: {game.platforms.join(", ")}
            </p>
          )}

          {game.trailerUrl && (
            <div className="flex flex-col border border-ink-700">
              <span className="bg-ink-950 text-center border-t border-ink-700 py-1">{game.name}'s Trailer</span>
              <video
                controls
                poster={game.backgroundImage || undefined}
                className="h-fit w-full md:sticky md:top-5"
              >
                <source src={game.trailerUrl} />
              </video>
            </div>
          )}
        </div>

        {game.website && (
          <a
            href={game.website}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-marigold-500 hover:text-marigold-400"
          >
            Official site ↗
          </a>
        )}
      </div>
    </div>
  );
}

function Badge({ label, tone }) {
  const toneClasses =
    tone === "marigold"
      ? "bg-marigold-500 text-ink-950"
      : "bg-teal-500 text-ink-950";
  return (
    <span className={`rounded-card px-2.5 py-1 text-xs font-semibold ${toneClasses}`}>
      {label}
    </span>
  );
}
