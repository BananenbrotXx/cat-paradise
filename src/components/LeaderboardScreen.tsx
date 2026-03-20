import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Coins, Star } from "lucide-react";

interface LeaderboardEntry {
  display_name: string;
  coins: number;
  level: number;
  user_id: string;
}

type SortBy = "coins" | "level";

interface LeaderboardScreenProps {
  currentUserId: string | null;
}

export default function LeaderboardScreen({ currentUserId }: LeaderboardScreenProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("coins");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("leaderboard")
        .select("display_name, coins, level, user_id")
        .order(sortBy, { ascending: false })
        .limit(50);
      setEntries(data || []);
      setLoading(false);
    };
    fetchLeaderboard();
  }, [sortBy]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4 tab-content-enter" key="leaderboard">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-extrabold tracking-tight">Bestenliste</h2>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl">
        <button
          onClick={() => setSortBy("coins")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all bounce-click ${
            sortBy === "coins" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
          }`}
        >
          <Coins className="w-3.5 h-3.5" /> Meiste Münzen
        </button>
        <button
          onClick={() => setSortBy("level")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all bounce-click ${
            sortBy === "level" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
          }`}
        >
          <Star className="w-3.5 h-3.5" /> Höchstes Level
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="game-card p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="game-card p-8 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-sm font-bold">Noch keine Einträge!</p>
          <p className="text-xs text-muted-foreground mt-1">Spiele das Spiel, um auf der Bestenliste zu erscheinen.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const isMe = entry.user_id === currentUserId;
            return (
              <div
                key={entry.user_id}
                className={`game-card p-3.5 flex items-center gap-3 section-reveal ${isMe ? "ring-2 ring-primary/30" : ""}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-extrabold shrink-0">
                  {i < 3 ? medals[i] : <span className="text-muted-foreground">{i + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">
                    {entry.display_name}
                    {isMe && <span className="text-[10px] font-bold text-primary ml-1">(Du)</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold shrink-0">
                  <span className="flex items-center gap-1 text-coin-foreground">🪙 <span className="tabular-nums">{entry.coins}</span></span>
                  <span className="flex items-center gap-1 text-primary">⭐ <span className="tabular-nums">{entry.level}</span></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
