import { useEffect, useState } from "react";
import { Sprout, Clock } from "lucide-react";

interface GardenScreenProps {
  coins: number;
  onSpend: (amount: number) => void;
  onReward: (coins: number) => void;
}

interface Plot {
  plantedAt: number | null;
  crop: Crop | null;
}

interface Crop {
  id: string;
  name: string;
  emoji: string;
  seedling: string;
  cost: number;
  reward: number;
  growMs: number;
}

const CROPS: Crop[] = [
  { id: "carrot", name: "Karotte", emoji: "🥕", seedling: "🌱", cost: 5, reward: 12, growMs: 30_000 },
  { id: "strawberry", name: "Erdbeere", emoji: "🍓", seedling: "🌿", cost: 15, reward: 45, growMs: 90_000 },
  { id: "pumpkin", name: "Kürbis", emoji: "🎃", seedling: "🌾", cost: 40, reward: 140, growMs: 240_000 },
  { id: "sakura", name: "Sakura", emoji: "🌸", seedling: "🌱", cost: 100, reward: 380, growMs: 600_000 },
];

const PLOTS_KEY = "garden_plots_v1";
const NUM_PLOTS = 6;

function loadPlots(): Plot[] {
  try {
    const raw = localStorage.getItem(PLOTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Plot[];
      if (Array.isArray(parsed) && parsed.length === NUM_PLOTS) return parsed;
    }
  } catch {}
  return Array.from({ length: NUM_PLOTS }, () => ({ plantedAt: null, crop: null }));
}

export default function GardenScreen({ coins, onSpend, onReward }: GardenScreenProps) {
  const [plots, setPlots] = useState<Plot[]>(loadPlots);
  const [selected, setSelected] = useState<Crop>(CROPS[0]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(PLOTS_KEY, JSON.stringify(plots));
  }, [plots]);

  const plantOrHarvest = (idx: number) => {
    const plot = plots[idx];
    if (!plot.plantedAt || !plot.crop) {
      if (coins < selected.cost) return;
      onSpend(selected.cost);
      setPlots((prev) => prev.map((p, i) => (i === idx ? { plantedAt: Date.now(), crop: selected } : p)));
    } else {
      const ready = now - plot.plantedAt >= plot.crop.growMs;
      if (!ready) return;
      onReward(plot.crop.reward);
      setPlots((prev) => prev.map((p, i) => (i === idx ? { plantedAt: null, crop: null } : p)));
    }
  };

  const formatLeft = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}m ${r}s`;
  };

  return (
    <div className="space-y-4 tab-content-enter" key="garden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sprout className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-extrabold tracking-tight">Kawaii Garten</h2>
        </div>
        <span className="text-[9px] font-extrabold bg-gradient-to-r from-secondary to-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
          Beta
        </span>
      </div>

      <div className="game-card p-4 space-y-3">
        <p className="text-xs text-muted-foreground">Wähle eine Saat, tippe ein leeres Beet zum Pflanzen und ernte, wenn die Pflanze reif ist. 🌱✨</p>
        <div className="grid grid-cols-2 gap-2">
          {CROPS.map((c) => {
            const active = selected.id === c.id;
            const canAfford = coins >= c.cost;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`p-2.5 rounded-2xl border-2 text-left transition-all bounce-click ${
                  active
                    ? "border-primary bg-primary/10"
                    : canAfford
                    ? "border-border bg-card hover:border-primary/40"
                    : "border-border bg-muted/30 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground">🪙 {c.cost} → {c.reward}</div>
                    <div className="text-[10px] text-muted-foreground">⏱ {formatLeft(c.growMs)}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="game-card p-4">
        <div className="grid grid-cols-3 gap-2">
          {plots.map((plot, i) => {
            const empty = !plot.plantedAt || !plot.crop;
            const elapsed = plot.plantedAt ? now - plot.plantedAt : 0;
            const total = plot.crop?.growMs ?? 1;
            const progress = Math.min(1, elapsed / total);
            const ready = !empty && progress >= 1;
            return (
              <button
                key={i}
                onClick={() => plantOrHarvest(i)}
                disabled={empty ? coins < selected.cost : !ready}
                className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all bounce-click relative overflow-hidden ${
                  ready
                    ? "border-secondary bg-secondary/15 animate-pulse"
                    : empty
                    ? "border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10"
                    : "border-border bg-accent/20"
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {empty ? (
                  <>
                    <span className="text-3xl opacity-60">➕</span>
                    <span className="text-[9px] font-bold text-muted-foreground">Pflanzen</span>
                  </>
                ) : ready ? (
                  <>
                    <span className="text-3xl">{plot.crop!.emoji}</span>
                    <span className="text-[9px] font-extrabold text-secondary">Ernten!</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl grayscale-[30%]">{plot.crop!.seedling}</span>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      {formatLeft(total - elapsed)}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                      <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${progress * 100}%` }} />
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
