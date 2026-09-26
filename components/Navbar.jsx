"use client";

export default function Navbar({ selectedCount, maxGames, generating, onGenerate }) {
  const disabled = selectedCount === 0 || generating;

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700 bg-ink-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <div className="flex flex-row content-center gap-5">
          <img className="max-w-10 h-auto" src="logo.png" />
          <span className="font-display text-lg font-bold text-parchment-100">
            GameNet
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-parchment-500 sm:inline">
            {selectedCount}/{maxGames} games selected
          </span>
          <button
            onClick={onGenerate}
            disabled={disabled}
            className="rounded-card bg-marigold-500 px-5 py-2 font-display text-sm font-medium text-ink-950 transition-colors hover:bg-marigold-400 disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-parchment-500"
          >
            {generating ? "Generating recommendations..." : "Generate recommendations"}
          </button>
        </div>
      </div>
    </header>
  );
}
