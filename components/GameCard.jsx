"use client";

export default function GameCard({ game, onClick, onRemove, reason }) {
  return (
    <div
      className="group relative flex w-full flex-col overflow-hidden rounded-card border border-ink-700 bg-ink-900 text-left transition-transform hover:-translate-y-0.5"
    >
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(game.id);
          }}
          aria-label={`Remove ${game.name} from your shelf`}
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-ink-950/80 text-parchment-100 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-clay-500"
        >
          ×
        </button>
      )}

      <button onClick={onClick} className="flex flex-1 flex-col text-left">
        <div className="relative h-32 w-full bg-ink-800">
          {game.backgroundImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={game.backgroundImage}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-parchment-500">
              No image
            </div>
          )}
          {game.metacritic && (
            <span className="absolute bottom-2 left-2 rounded-card bg-marigold-500 px-2 py-0.5 text-xs font-semibold text-ink-950">
              {game.metacritic}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <h3 className="font-display text-base font-medium leading-snug text-parchment-100">
            {game.name}
          </h3>

          {game.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {game.genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="rounded-card bg-teal-500/15 px-2 py-0.5 text-xs text-teal-400"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {reason && (
            <p className="mt-1 text-sm leading-snug text-parchment-300">{reason}</p>
          )}
        </div>
      </button>
    </div>
  );
}
