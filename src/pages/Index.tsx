import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useCatGame } from "@/hooks/useCatGame";
import CatDisplay from "@/components/CatDisplay";
import StatBars from "@/components/StatBars";
import ActionButtons from "@/components/ActionButtons";
import Shop from "@/components/Shop";
import SkinShop, { CAT_SKINS } from "@/components/SkinShop";
import MiniGameScreen from "@/components/MiniGameScreen";
import DailyStreakPopup from "@/components/DailyStreakPopup";
import OfflineEarningsPopup from "@/components/OfflineEarningsPopup";
import RandomEventPopup from "@/components/RandomEventPopup";
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
  const [shopTab, setShopTab] = useState<"items" | "skins">("items");

  const {
    cat, quests, village, activeTab, setActiveTab,
    pet, play, rest, buyItem, visitLocation, claimQuest,
    isAnimating, floatingCoins, floatingHearts,
    notification, completedQuests, totalQuests,
    actionCooldowns, skipAllCooldowns,
    addCoins, offlineEarnings, collectOfflineEarnings,
    gameLoaded, ownedSkins, buySkin, equipSkin, applyRandomEvent,
  } = useCatGame(user?.id);

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

  // Check admin role
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

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
        is_admin: isAdmin,
      }).eq("user_id", user.id);
    } else {
      await supabase.from("leaderboard").insert({
        user_id: user.id,
        coins: cat.coins,
        level: cat.level,
        display_name: displayName,
        is_admin: isAdmin,
      });
    }
  }, [user, cat.coins, cat.level, isAdmin]);

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

  if (authLoading || (!gameLoaded && user)) {
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

      {/* Daily Streak */}
      <DailyStreakPopup userId={user.id} onReward={(coins) => addCoins(coins)} />

      {/* Offline Earnings */}
      {offlineEarnings && (
        <OfflineEarningsPopup
          coins={offlineEarnings.coins}
          minutesAway={offlineEarnings.minutes}
          onCollect={collectOfflineEarnings}
        />
      )}

      {/* Random Events */}
      <RandomEventPopup onApplyEvent={applyRandomEvent} gameLoaded={gameLoaded} />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/90 backdrop-blur-lg border-b-2 border-primary/10">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">🐱 {cat.name}</h1>
            <span className="text-[10px] font-extrabold bg-primary/12 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              Lv.{cat.level}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-extrabold bg-coin/15 border border-coin/20 px-3 py-1 rounded-full text-xs text-coin-foreground">
              🪙 <span className="tabular-nums">{cat.coins.toLocaleString()}</span>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-xl hover:bg-primary/10 transition-colors bounce-click" title="Abmelden">
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
              activeSkin={cat.activeSkin}
            />
            <StatBars hunger={cat.hunger} happiness={cat.happiness} energy={cat.energy} multiplier={cat.multiplier} />
            <ActionButtons onPet={pet} onPlay={play} onRest={rest} energy={cat.energy} actionCooldowns={actionCooldowns} />
            <div className="game-card p-3 text-center text-xs text-muted-foreground section-reveal section-reveal-delay-3">
              Halte alle Stats hoch für bis zu <strong className="text-secondary">×{(3.0 + (CAT_SKINS.find(s => s.id === cat.activeSkin)?.multiplierBonus || 0)).toFixed(1)}</strong> Münz-Bonus!
            </div>
          </div>
        )}

        {activeTab === "village" && (
          <VillageScreen locations={village} onVisit={visitLocation} multiplier={cat.multiplier} />
        )}

        {activeTab === "shop" && (
          <div className="space-y-4 tab-content-enter" key="shop-tab">
            {/* Shop sub-tabs */}
            <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl">
              <button
                onClick={() => setShopTab("items")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all bounce-click ${
                  shopTab === "items" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🛒 Items
              </button>
              <button
                onClick={() => setShopTab("skins")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all bounce-click ${
                  shopTab === "skins" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🎨 Skins
              </button>
            </div>

            {shopTab === "items" ? (
              <Shop coins={cat.coins} onBuy={buyItem} />
            ) : (
              <SkinShop
                coins={cat.coins}
                userId={user.id}
                activeSkin={cat.activeSkin}
                onBuySkin={buySkin}
                onEquipSkin={equipSkin}
                ownedSkins={ownedSkins}
              />
            )}
          </div>
        )}

        {activeTab === "quests" && (
          <QuestScreen quests={quests} onClaim={claimQuest} multiplier={cat.multiplier} />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardScreen currentUserId={user.id} />
        )}

        {activeTab === "minigames" && (
          <MiniGameScreen onReward={(coins) => addCoins(coins)} />
        )}

        {activeTab === "admin" && isAdmin && (
          <AdminPanel onSkipCooldowns={skipAllCooldowns} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} questBadge={claimableQuests} isAdmin={isAdmin} />
    </div>
  );
}
