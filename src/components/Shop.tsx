import { useState } from "react";
import { SHOP_ITEMS, type ShopItem } from "@/hooks/useCatGame";

interface ShopProps {
  coins: number;
  onBuy: (item: ShopItem) => boolean;
}

export default function Shop({ coins, onBuy }: ShopProps) {
  const [tab, setTab] = useState<"food" | "toy">("food");
  const [boughtId, setBoughtId] = useState<string | null>(null);

  const items = SHOP_ITEMS.filter((i) => i.type === tab);

  const handleBuy = (item: ShopItem) => {
    const success = onBuy(item);
    if (success) {
      setBoughtId(item.id);
      setTimeout(() => setBoughtId(null), 600);
    }
  };

  return (
    <div className="game-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">🛒 Shop</h3>
        <div className="flex items-center gap-1 font-bold text-coin-foreground bg-accent/60 px-3 py-1 rounded-full">
          <span>🪙</span>
          <span className="tabular-nums">{coins}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("food")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors bounce-click ${
            tab === "food" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🍽️ Futter
        </button>
        <button
          onClick={() => setTab("toy")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors bounce-click ${
            tab === "toy" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🎮 Spielzeug
        </button>
      </div>

      {/* Items */}
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const canAfford = coins >= item.price;
          const justBought = boughtId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleBuy(item)}
              disabled={!canAfford}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all bounce-click ${
                justBought
                  ? "border-health bg-health/10 scale-95"
                  : canAfford
                  ? "border-transparent bg-background hover:border-primary/30 hover:shadow-md"
                  : "border-transparent bg-background opacity-50 cursor-not-allowed"
              }`}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs font-semibold leading-tight">{item.name}</span>
              <span className="text-xs font-bold text-coin-foreground">🪙 {item.price}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
