import { useState } from "react";
import type { VillageLocation } from "@/hooks/useCatGame";
import { MapPin, Clock, ArrowRight } from "lucide-react";

interface VillageScreenProps {
  locations: VillageLocation[];
  onVisit: (id: string) => boolean;
  multiplier: number;
}

function getCooldownRemaining(loc: VillageLocation): number {
  if (!loc.lastVisited) return 0;
  const elapsed = (Date.now() - loc.lastVisited) / 1000;
  return Math.max(0, Math.ceil(loc.cooldown - elapsed));
}

function formatTime(seconds: number) {
  if (seconds <= 0) return "Bereit!";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function VillageScreen({ locations, onVisit, multiplier }: VillageScreenProps) {
  const [visitedId, setVisitedId] = useState<string | null>(null);

  const handleVisit = (id: string) => {
    const success = onVisit(id);
    if (success) {
      setVisitedId(id);
      setTimeout(() => setVisitedId(null), 800);
    }
  };

  return (
    <div className="space-y-4 tab-content-enter" key="village">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-5 h-5 text-village" />
        <h2 className="text-lg font-extrabold tracking-tight">Mochis Dorf</h2>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Erkunde das Dorf mit Mochi und entdecke besondere Orte!
      </p>

      {/* Locations */}
      <div className="space-y-2.5">
        {locations.map((loc, i) => {
          const cooldown = getCooldownRemaining(loc);
          const isReady = cooldown <= 0;
          const justVisited = visitedId === loc.id;

          return (
            <button
              key={loc.id}
              onClick={() => handleVisit(loc.id)}
              disabled={!isReady}
              className={`w-full game-card p-4 text-left transition-all bounce-click section-reveal ${
                justVisited ? "ring-2 ring-village scale-[0.98]" : ""
              } ${!isReady ? "opacity-55" : ""}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-village/10 flex items-center justify-center text-2xl shrink-0">
                  {loc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold">{loc.name}</h3>
                    {isReady ? (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-village bg-village/10 px-2 py-0.5 rounded-full">
                        {loc.action} <ArrowRight className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatTime(cooldown)}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{loc.description}</p>
                  <div className="flex gap-1.5 mt-2">
                    <span className="text-[9px] font-bold bg-accent/40 text-coin-foreground px-1.5 py-0.5 rounded">
                      +{Math.round(loc.coinReward * multiplier)}🪙
                    </span>
                    {loc.statBoost.hunger && loc.statBoost.hunger > 0 && (
                      <span className="text-[9px] font-bold bg-hunger/10 text-hunger px-1.5 py-0.5 rounded">+{loc.statBoost.hunger}🍗</span>
                    )}
                    {loc.statBoost.happiness && loc.statBoost.happiness > 0 && (
                      <span className="text-[9px] font-bold bg-happiness/10 text-happiness px-1.5 py-0.5 rounded">+{loc.statBoost.happiness}💕</span>
                    )}
                    {loc.statBoost.energy && loc.statBoost.energy > 0 && (
                      <span className="text-[9px] font-bold bg-energy/10 text-energy px-1.5 py-0.5 rounded">+{loc.statBoost.energy}⚡</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
