import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Sparkles } from "lucide-react";

interface Broadcast {
  id: string;
  reward_type: "coins" | "xp";
  amount: number;
  message: string;
  created_at: string;
}

interface Props {
  userId: string;
  gameLoaded: boolean;
  onCoins: (amount: number) => void;
  onXp: (amount: number) => void;
}

export default function BroadcastPopup({ userId, gameLoaded, onCoins, onXp }: Props) {
  const [queue, setQueue] = useState<Broadcast[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!gameLoaded || !userId || loaded) return;
    (async () => {
      const { data: claims } = await supabase
        .from("broadcast_claims" as any)
        .select("broadcast_id")
        .eq("user_id", userId);
      const claimedIds = new Set(((claims as any[]) || []).map((c) => c.broadcast_id));
      const { data: broadcasts } = await supabase
        .from("broadcasts" as any)
        .select("id, reward_type, amount, message, created_at")
        .order("created_at", { ascending: true });
      const unclaimed = ((broadcasts as any[]) || []).filter((b) => !claimedIds.has(b.id));
      setQueue(unclaimed as Broadcast[]);
      setLoaded(true);
    })();
  }, [gameLoaded, userId, loaded]);

  const current = queue[0];
  if (!current) return null;

  const handleClaim = async () => {
    if (current.reward_type === "coins") onCoins(current.amount);
    else onXp(current.amount);
    await supabase.from("broadcast_claims" as any).insert({ user_id: userId, broadcast_id: current.id });
    setQueue((prev) => prev.slice(1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-scale-in">
      <div className="game-card p-6 w-full max-w-sm text-center space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-gradient-to-br from-primary via-secondary to-accent" />
        <div className="relative space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-bounce-in">
            <Gift className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 text-secondary" /> Nachricht vom Admin
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {new Date(current.created_at).toLocaleString("de-DE")}
            </p>
          </div>
          {current.message && (
            <p className="text-sm text-foreground bg-muted/50 rounded-xl p-3 whitespace-pre-wrap break-words">
              {current.message}
            </p>
          )}
          <div className="text-2xl font-extrabold">
            {current.reward_type === "coins" ? `🪙 +${current.amount}` : `⭐ +${current.amount} XP`}
          </div>
          <button
            onClick={handleClaim}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-extrabold text-sm bounce-click"
          >
            🎁 Abholen
          </button>
          {queue.length > 1 && (
            <p className="text-[10px] text-muted-foreground">Noch {queue.length - 1} weitere Nachricht{queue.length - 1 === 1 ? "" : "en"}</p>
          )}
        </div>
      </div>
    </div>
  );
}
