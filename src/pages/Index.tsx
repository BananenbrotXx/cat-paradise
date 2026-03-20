import { useCatGame } from "@/hooks/useCatGame";
import CatDisplay from "@/components/CatDisplay";
import StatBars from "@/components/StatBars";
import ActionButtons from "@/components/ActionButtons";
import Shop from "@/components/Shop";
import VillageScreen from "@/components/VillageScreen";
import QuestScreen from "@/components/QuestScreen";
import BottomNav from "@/components/BottomNav";
import NotificationToast from "@/components/NotificationToast";

export default function Index() {
  const {
    cat, quests, village, activeTab, setActiveTab,
    pet, play, rest, buyItem, visitLocation, claimQuest,
    isAnimating, floatingCoins, floatingHearts,
    notification, completedQuests, totalQuests,
  } = useCatGame();

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
          <div className="flex items-center gap-1.5 font-extrabold bg-accent/50 px-3 py-1 rounded-full text-xs text-coin-foreground">
            🪙 <span className="tabular-nums">{cat.coins}</span>
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
            <ActionButtons onPet={pet} onPlay={play} onRest={rest} energy={cat.energy} />

            {/* Multiplier hint */}
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
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} questBadge={claimableQuests} />
    </div>
  );
}
