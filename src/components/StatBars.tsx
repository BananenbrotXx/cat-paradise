interface StatBarProps {
  label: string;
  value: number;
  color: string;
  icon: string;
}

function StatBar({ label, value, color, icon }: StatBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold">
        <span className="flex items-center gap-1">
          <span>{icon}</span>
          <span>{label}</span>
        </span>
        <span className="tabular-nums text-muted-foreground">{Math.round(value)}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

interface StatBarsProps {
  hunger: number;
  happiness: number;
  energy: number;
  multiplier: number;
}

export default function StatBars({ hunger, happiness, energy, multiplier }: StatBarsProps) {
  return (
    <div className="game-card p-4 space-y-3 section-reveal section-reveal-delay-1">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-extrabold tracking-tight">Status</h3>
        <div className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full transition-colors ${
          multiplier >= 2.5 ? "bg-secondary/15 text-secondary animate-pulse-glow" :
          multiplier >= 1.5 ? "bg-primary/15 text-primary" :
          "bg-muted text-muted-foreground"
        }`}>
          ×{multiplier.toFixed(1)}
        </div>
      </div>
      <StatBar label="Sättigung" value={hunger} color="hsl(var(--hunger))" icon="🍗" />
      <StatBar label="Glück" value={happiness} color="hsl(var(--happiness))" icon="💕" />
      <StatBar label="Energie" value={energy} color="hsl(var(--energy))" icon="⚡" />
    </div>
  );
}
