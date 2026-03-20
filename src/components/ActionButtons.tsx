interface ActionButtonsProps {
  onPlay: () => void;
  onRest: () => void;
  energy: number;
  multiplier: number;
}

export default function ActionButtons({ onPlay, onRest, energy, multiplier }: ActionButtonsProps) {
  return (
    <div className="game-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Aktionen</h3>
        <div className={`text-sm font-bold px-3 py-1 rounded-full ${
          multiplier >= 2.5 ? "bg-secondary text-secondary-foreground animate-pulse-glow" :
          multiplier >= 1.5 ? "bg-primary text-primary-foreground" :
          "bg-muted text-muted-foreground"
        }`}>
          ×{multiplier.toFixed(1)} Bonus
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onPlay}
          disabled={energy < 10}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 p-4 font-semibold transition-colors bounce-click disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-2xl">🎾</span>
          <span className="text-sm">Spielen</span>
          <span className="text-xs text-muted-foreground">+5🪙 −12⚡</span>
        </button>

        <button
          onClick={onRest}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-energy/10 hover:bg-energy/20 p-4 font-semibold transition-colors bounce-click"
        >
          <span className="text-2xl">💤</span>
          <span className="text-sm">Ausruhen</span>
          <span className="text-xs text-muted-foreground">+2🪙 +25⚡</span>
        </button>
      </div>
    </div>
  );
}
