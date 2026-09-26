"use client";

import { useEffect, useRef, useState } from "react";

export default function SearchBar({ onSelect, disabled }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(game) {
    onSelect(game);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor="game-search" className="sr-only">
        Search for a game
      </label>
      <input
        id="game-search"
        type="text"
        value={query}
        disabled={disabled}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={
          disabled
            ? "You've got 5 games on the shelf — remove one to add another"
            : "Type a game you love, like Hollow Knight or Portal 2…"
        }
        className="w-full rounded-card border border-ink-600 bg-ink-900 px-5 py-4 text-lg text-parchment-100 placeholder:text-parchment-500 focus:border-marigold-500 disabled:cursor-not-allowed disabled:opacity-50"
      />

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-card border border-ink-600 bg-ink-900 shadow-xl">
          {loading && (
            <p className="px-5 py-3 text-sm text-parchment-500">Searching…</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-5 py-3 text-sm text-parchment-500">
              No matches on RAWG for “{query}”.
            </p>
          )}
          {!loading &&
            results.map((game) => (
              <button
                key={game.id}
                onClick={() => handleSelect(game)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-800"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-card bg-ink-700">
                  {game.backgroundImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={game.backgroundImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-parchment-100">{game.name}</p>
                  <p className="truncate text-sm text-parchment-500">
                    {game.released?.slice(0, 4) || "TBA"}
                    {game.genres?.length ? ` · ${game.genres.slice(0, 2).join(", ")}` : ""}
                  </p>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
