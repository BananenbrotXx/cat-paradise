import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useCatGame } from "@/hooks/useCatGame";
import CatDisplay from "@/components/CatDisplay";
import StatBars from "@/components/StatBars";
import ActionButtons from "@/components/ActionButtons";
import Shop from "@/components/Shop";
import VillageScreen from "@/components/VillageScreen";
import QuestScreen from "@/components/QuestScreen";
import LeaderboardScreen from "@/components/LeaderboardScreen";
import AdminPanel from "@/components/AdminPanel";
import BottomNav from "@/components/BottomNav";
import NotificationToast from "@/components/NotificationToast";
import AuthScreen from "@/components/AuthScreen";
import { LogOut } from "lucide-react";

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const {
    cat, quests, village, activeTab, setActiveTab,
    pet, play, rest, buyItem, visitLocation, claimQuest,
    isAnimating, floatingCoins, floatingHearts,
    notification, completedQuests, totalQuests,
    actionCooldowns, skipAllCooldowns,
  } = useCatGame();

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Save score to leaderboard periodically
  const saveScore = useCallback(async () => {
    if (!user) return;
    const displayName = user.user_metadata?.display_name || "Spieler";
    const { data: existing } = await supabase
      .from("leaderboard")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("leaderboard").update({
        coins: cat.coins,
        level: cat.level,
        display_name: displayName,
      }).eq("user_id", user.id);
    } else {
      await supabase.from("leaderboard").insert({
        user_id: user.id,
        coins: cat.coins,
        level: cat.level,
        display_name: displayName,
      });
    }
  }, [user, cat.coins, cat.level]);

  // Auto-save every 15 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(saveScore, 15000);
    return () => clearInterval(interval);
  }, [user, saveScore]);

  // Save on tab change to leaderboard
  useEffect(() => {
    if (activeTab === "leaderboard" && user) saveScore();
  }, [activeTab, user, saveScore]);

  const handleLogout = async () => {
    await saveScore();
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-float">🐱</div>
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  const claimableQuests = quests.filter((q) => q.completed && !q.claimed).length;

  return (
    <div className="min-h-screen pb-20">
      <NotificationToast message={notification} />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight">🐱 {cat.name}</h1>
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Lv.{cat.level}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-extrabold bg-accent/50 px-3 py-1 rounded-full text-xs text-coin-foreground">
              🪙 <span className="tabular-nums">{cat.coins}</span>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-muted transition-colors bounce-click" title="Abmelden">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 mt-5">
        {activeTab === "cat" && (
          <div className="space-y-4 tab-content-enter" key="cat-tab">
            <CatDisplay
              mood={cat.mood}
              isAnimating={isAnimating}
              lastInteraction={cat.lastInteraction}
              floatingCoins={floatingCoins}
              floatingHearts={floatingHearts}
              onPet={pet}
              level={cat.level}
              xp={cat.xp}
              xpToNext={cat.xpToNext}
            />
            <StatBars hunger={cat.hunger} happiness={cat.happiness} energy={cat.energy} multiplier={cat.multiplier} />
            <ActionButtons onPet={pet} onPlay={play} onRest={rest} energy={cat.energy} actionCooldowns={actionCooldowns} />
            <div className="game-card p-3 text-center text-xs text-muted-foreground section-reveal section-reveal-delay-3">
              Halte alle Stats hoch für bis zu <strong className="text-secondary">×3.0</strong> Münz-Bonus!
            </div>
          </div>
        )}

        {activeTab === "village" && (
          <VillageScreen locations={village} onVisit={visitLocation} multiplier={cat.multiplier} />
        )}

        {activeTab === "shop" && (
          <Shop coins={cat.coins} onBuy={buyItem} />
        )}

        {activeTab === "quests" && (
          <QuestScreen quests={quests} onClaim={claimQuest} multiplier={cat.multiplier} />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardScreen currentUserId={user.id} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} questBadge={claimableQuests} />
    </div>
  );
}
