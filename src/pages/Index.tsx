import { useCatGame } from "@/hooks/useCatGame";
import CatDisplay from "@/components/CatDisplay";
import StatBars from "@/components/StatBars";
import ActionButtons from "@/components/ActionButtons";
import Shop from "@/components/Shop";

export default function Index() {
  const { cat, pet, play, rest, buyItem, isAnimating, floatingCoins, floatingHearts } = useCatGame();

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-extrabold tracking-tight">🐱 {cat.name}</h1>
          <div className="flex items-center gap-1.5 font-bold bg-accent/60 px-3 py-1 rounded-full text-sm text-coin-foreground">
            🪙 <span className="tabular-nums">{cat.coins}</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 space-y-5 mt-6">
        {/* Cat */}
        <CatDisplay
          mood={cat.mood}
          isAnimating={isAnimating}
          lastInteraction={cat.lastInteraction}
          floatingCoins={floatingCoins}
          floatingHearts={floatingHearts}
          onPet={pet}
        />

        {/* Stats */}
        <StatBars hunger={cat.hunger} happiness={cat.happiness} energy={cat.energy} />

        {/* Actions */}
        <ActionButtons onPlay={play} onRest={rest} energy={cat.energy} multiplier={cat.multiplier} />

        {/* Shop */}
        <Shop coins={cat.coins} onBuy={buyItem} />

        {/* Multiplier info */}
        <div className="game-card p-4 text-center text-sm text-muted-foreground">
          <p>
            Je besser es deiner Katze geht, desto höher der <strong className="text-foreground">Belohnungs-Multiplikator</strong>!
          </p>
          <p className="mt-1">
            Halte Sättigung, Glück und Energie hoch für bis zu <strong className="text-secondary">×3.0</strong> Münzen.
          </p>
        </div>
      </main>
    </div>
  );
}
