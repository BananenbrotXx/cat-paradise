interface StatBarProps {
  label: string;
  value: number;
  color: string;
  icon: string;
  bgColor: string;
}

function StatBar({ label, value, color, icon, bgColor }: StatBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold">
        <span className="flex items-center gap-1.5">
          <span className="text-sm">{icon}</span>
          <span>{label}</span>
        </span>
        <span className="tabular-nums text-muted-foreground text-[11px]">{Math.round(value)}%</span>
      </div>
      <div className="h-3 w-full rounded-full overflow-hidden" style={{ backgroundColor: bgColor }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
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
        <h3 className="text-sm font-extrabold tracking-tight flex items-center gap-1.5">
          ✨ Status
        </h3>
        <div className={`text-xs font-extrabold px-3 py-1 rounded-full transition-colors border ${
          multiplier >= 2.5 ? "bg-secondary/15 text-secondary border-secondary/20 animate-pulse-glow" :
          multiplier >= 1.5 ? "bg-primary/15 text-primary border-primary/20" :
          "bg-muted text-muted-foreground border-border"
        }`}>
          ×{multiplier.toFixed(1)} Bonus
        </div>
      </div>
      <StatBar label="Sättigung" value={hunger} color="hsl(var(--hunger))" bgColor="hsl(var(--hunger) / 0.15)" icon="🍗" />
      <StatBar label="Glück" value={happiness} color="hsl(var(--happiness))" bgColor="hsl(var(--happiness) / 0.15)" icon="💕" />
      <StatBar label="Energie" value={energy} color="hsl(var(--energy))" bgColor="hsl(var(--energy) / 0.15)" icon="⚡" />
    </div>
  );
}
