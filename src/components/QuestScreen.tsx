import { useState, useEffect } from "react";
import type { Quest } from "@/hooks/useCatGame";
import { Scroll, Check, Gift, Clock } from "lucide-react";

function getNextMidnightCET(): number {
  const now = new Date();
  const berlinNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const todayMidnight = new Date(berlinNow);
  todayMidnight.setHours(0, 0, 0, 0);
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
  const offsetMs = berlinNow.getTime() - now.getTime();
  return tomorrowMidnight.getTime() - offsetMs;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

interface QuestScreenProps {
  quests: Quest[];
  onClaim: (id: string) => void;
  multiplier: number;
}

export default function QuestScreen({ quests, onClaim, multiplier }: QuestScreenProps) {
  const completed = quests.filter((q) => q.completed).length;
  const [resetIn, setResetIn] = useState(() => Math.max(0, getNextMidnightCET() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setResetIn(Math.max(0, getNextMidnightCET() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4 tab-content-enter" key="quests">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scroll className="w-5 h-5 text-quest" />
          <h2 className="text-lg font-extrabold tracking-tight">Tages-Quests</h2>
        </div>
        <div className="text-xs font-bold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
          {completed}/{quests.length} ✓
        </div>
      </div>

      {/* Reset countdown */}
      <div className="game-card p-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span className="font-bold">Neue Quests in <span className="tabular-nums text-primary">{formatCountdown(resetIn)}</span></span>
      </div>

      {/* Progress overview */}
      <div className="game-card p-3">
        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full rounded-full bg-quest transition-all duration-700 ease-out"
            style={{ width: `${(completed / quests.length) * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center font-semibold">
          {completed === quests.length ? "🎉 Alle Quests abgeschlossen!" : `Noch ${quests.length - completed} Quests offen`}
        </p>
      </div>

      {/* Quest list */}
      <div className="space-y-2">
        {quests.map((quest, i) => {
          const progressPercent = (quest.progress / quest.target) * 100;
          const canClaim = quest.completed && !quest.claimed;

          return (
            <div
              key={quest.id}
              className={`game-card p-4 section-reveal ${quest.claimed ? "opacity-50" : ""}`}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                  quest.claimed ? "bg-muted" : quest.completed ? "bg-quest/15" : "bg-muted/60"
                }`}>
                  {quest.claimed ? <Check className="w-5 h-5 text-health" /> : quest.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-extrabold ${quest.claimed ? "line-through text-muted-foreground" : ""}`}>
                      {quest.title}
                    </h3>
                    {canClaim ? (
                      <button
                        onClick={() => onClaim(quest.id)}
                        className="flex items-center gap-1 text-[10px] font-extrabold text-quest bg-quest/15 hover:bg-quest/25 px-2.5 py-1 rounded-full transition-colors bounce-click"
                      >
                        <Gift className="w-3 h-3" />
                        +{Math.round(quest.reward * multiplier)}🪙
                      </button>
                    ) : quest.claimed ? (
                      <span className="text-[10px] font-bold text-health">Erledigt ✓</span>
                    ) : (
                      <span className="text-[10px] font-bold text-coin-foreground">
                        +{Math.round(quest.reward * multiplier)}🪙
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{quest.description}</p>
                  {!quest.claimed && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[9px] font-bold text-muted-foreground mb-0.5">
                        <span>Fortschritt</span>
                        <span className="tabular-nums">{quest.progress}/{quest.target}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${quest.completed ? "bg-quest" : "bg-primary/60"}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
