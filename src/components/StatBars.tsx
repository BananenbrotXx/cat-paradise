interface StatBarProps {
  label: string;
  value: number;
  color: string;
  emoji: string;
}

function StatBar({ label, value, color, emoji }: StatBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm font-semibold">
        <span>{emoji} {label}</span>
        <span className="tabular-nums">{Math.round(value)}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="stat-bar"
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
}

export default function StatBars({ hunger, happiness, energy }: StatBarsProps) {
  return (
    <div className="game-card p-5 space-y-3">
      <StatBar label="Sättigung" value={hunger} color="hsl(var(--hunger))" emoji="🍗" />
      <StatBar label="Glück" value={happiness} color="hsl(var(--happiness))" emoji="💕" />
      <StatBar label="Energie" value={energy} color="hsl(var(--energy))" emoji="⚡" />
    </div>
  );
}
