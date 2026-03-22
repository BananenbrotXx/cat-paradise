import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Gift, X } from "lucide-react";

const STREAK_REWARDS = [5, 10, 15, 20, 30, 40, 60]; // Day 1–7

interface DailyStreakPopupProps {
  userId: string;
  onReward: (coins: number) => void;
}

export default function DailyStreakPopup({ userId, onReward }: DailyStreakPopupProps) {
  const [show, setShow] = useState(false);
  const [streak, setStreak] = useState(0);
  const [reward, setReward] = useState(0);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    checkStreak();
  }, [userId]);

  const checkStreak = async () => {
    const { data } = await supabase
      .from("daily_streaks" as any)
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const today = new Date().toISOString().split("T")[0];

    if (!data) {
      // First time: create streak and show reward
      setStreak(1);
      setReward(STREAK_REWARDS[0]);
      setShow(true);
      return;
    }

    const lastClaim = (data as any).last_claim_date;
    if (lastClaim === today) return; // Already claimed today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak: number;
    if (lastClaim === yesterdayStr) {
      newStreak = Math.min(7, ((data as any).current_streak || 0) + 1);
    } else {
      newStreak = 1; // Streak broken
    }

    setStreak(newStreak);
    setReward(STREAK_REWARDS[Math.min(newStreak - 1, STREAK_REWARDS.length - 1)]);
    setShow(true);
  };

  const claimReward = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("daily_streaks" as any)
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase.from("daily_streaks" as any)
        .update({ current_streak: streak, last_claim_date: today } as any)
        .eq("user_id", userId);
    } else {
      await supabase.from("daily_streaks" as any)
        .insert({ user_id: userId, current_streak: streak, last_claim_date: today } as any);
    }

    onReward(reward);
    setClaimed(true);
    setTimeout(() => setShow(false), 1500);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="game-card p-6 w-[90%] max-w-sm space-y-4 text-center animate-scale-in">
        <button onClick={() => setShow(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>

        <div className="text-4xl">🔥</div>
        <h2 className="text-lg font-extrabold">Tägliche Belohnung!</h2>

        {/* Streak dots */}
        <div className="flex justify-center gap-1.5">
          {STREAK_REWARDS.map((r, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                i < streak
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Tag {streak} Streak</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {streak >= 7 ? "Maximale Streak erreicht! 🎉" : `Komm morgen wieder für Tag ${streak + 1}!`}
          </p>
        </div>

        {!claimed ? (
          <button
            onClick={claimReward}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm bounce-click flex items-center justify-center gap-2"
          >
            <Gift className="w-4 h-4" />
            +{reward} 🪙 einsammeln
          </button>
        ) : (
          <div className="py-3 text-sm font-bold text-primary animate-scale-in">
            ✅ +{reward} Coins erhalten!
          </div>
        )}
      </div>
    </div>
  );
}
