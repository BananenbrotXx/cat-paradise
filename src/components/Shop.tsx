import { useState } from "react";
import { SHOP_ITEMS, type ShopItem } from "@/hooks/useCatGame";
import { ShoppingBag, Sparkles, UtensilsCrossed, Gift } from "lucide-react";

interface ShopProps {
  coins: number;
  onBuy: (item: ShopItem) => boolean;
}

type ShopTab = "food" | "toy" | "decor";

const TAB_CONFIG: { id: ShopTab; label: string; icon: React.ReactNode }[] = [
  { id: "food", label: "Futter", icon: <UtensilsCrossed className="w-3.5 h-3.5" /> },
  { id: "toy", label: "Spielzeug", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: "decor", label: "Deko", icon: <Gift className="w-3.5 h-3.5" /> },
];

export default function Shop({ coins, onBuy }: ShopProps) {
  const [tab, setTab] = useState<ShopTab>("food");
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
    <div className="space-y-4 tab-content-enter" key="shop">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-extrabold tracking-tight">Mochis Laden</h2>
        </div>
        <div className="flex items-center gap-1.5 font-extrabold text-coin-foreground bg-accent/50 px-3 py-1 rounded-full text-sm">
          🪙 <span className="tabular-nums">{coins}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl">
        {TAB_CONFIG.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all bounce-click ${
              tab === t.id
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item, i) => {
          const canAfford = coins >= item.price;
          const justBought = boughtId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleBuy(item)}
              disabled={!canAfford}
              className={`game-card p-3.5 text-left transition-all bounce-click section-reveal ${
                justBought ? "ring-2 ring-health scale-[0.97]" : ""
              } ${!canAfford ? "opacity-45 cursor-not-allowed" : ""}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-xs font-extrabold text-coin-foreground bg-accent/40 px-2 py-0.5 rounded-full">
                  🪙 {item.price}
                </span>
              </div>
              <div className="text-xs font-bold leading-tight">{item.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{item.description}</div>
              {/* Stat boosts */}
              <div className="flex flex-wrap gap-1 mt-2">
                {item.hungerRestore && (
                  <span className="text-[9px] font-bold bg-hunger/10 text-hunger px-1.5 py-0.5 rounded">+{item.hungerRestore} 🍗</span>
                )}
                {item.happinessBoost && item.happinessBoost > 0 && (
                  <span className="text-[9px] font-bold bg-happiness/10 text-happiness px-1.5 py-0.5 rounded">+{item.happinessBoost} 💕</span>
                )}
                {item.energyBoost && item.energyBoost > 0 && (
                  <span className="text-[9px] font-bold bg-energy/10 text-energy px-1.5 py-0.5 rounded">+{item.energyBoost} ⚡</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
