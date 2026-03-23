import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Check, Lock } from "lucide-react";

export interface CatSkin {
  id: string;
  name: string;
  emoji: string;
  price: number;
  multiplierBonus: number;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  cssClass: string;
}

export const CAT_SKINS: CatSkin[] = [
  { id: "default", name: "Normal", emoji: "🐱", price: 0, multiplierBonus: 0, description: "Das Original — Mochi pur!", rarity: "common", cssClass: "" },
  { id: "tuxedo", name: "Smoking", emoji: "🎩", price: 500, multiplierBonus: 0.1, description: "Elegant und stilvoll", rarity: "common", cssClass: "brightness-110 contrast-110" },
  { id: "ginger", name: "Ingwer", emoji: "🧡", price: 1500, multiplierBonus: 0.2, description: "Warm und kuschelig", rarity: "common", cssClass: "sepia-[0.3] saturate-150" },
  { id: "midnight", name: "Mitternacht", emoji: "🌙", price: 5000, multiplierBonus: 0.3, description: "Geheimnisvoll wie die Nacht", rarity: "rare", cssClass: "brightness-75 contrast-125 hue-rotate-[220deg]" },
  { id: "sakura", name: "Sakura", emoji: "🌸", price: 12000, multiplierBonus: 0.4, description: "Zart wie Kirschblüten", rarity: "rare", cssClass: "hue-rotate-[320deg] saturate-125 brightness-110" },
  { id: "golden", name: "Golden", emoji: "✨", price: 30000, multiplierBonus: 0.5, description: "Glänzend und edel", rarity: "epic", cssClass: "sepia saturate-200 brightness-110 hue-rotate-[10deg]" },
  { id: "galaxy", name: "Galaxie", emoji: "🌌", price: 75000, multiplierBonus: 0.7, description: "Aus den Sternen geboren", rarity: "epic", cssClass: "hue-rotate-[260deg] saturate-200 brightness-90 contrast-125" },
  { id: "rainbow", name: "Regenbogen", emoji: "🌈", price: 200000, multiplierBonus: 1.0, description: "Der ultimative Skin — Legendär!", rarity: "legendary", cssClass: "animate-rainbow-hue saturate-150 brightness-110" },
];

const RARITY_COLORS: Record<string, string> = {
  common: "border-muted-foreground/30 bg-muted/20",
  rare: "border-blue-500/40 bg-blue-500/10",
  epic: "border-purple-500/40 bg-purple-500/10",
  legendary: "border-yellow-500/50 bg-gradient-to-br from-yellow-500/15 to-orange-500/15",
};

const RARITY_LABELS: Record<string, { label: string; color: string }> = {
  common: { label: "Gewöhnlich", color: "text-muted-foreground" },
  rare: { label: "Selten", color: "text-blue-500" },
  epic: { label: "Episch", color: "text-purple-500" },
  legendary: { label: "Legendär", color: "text-yellow-500" },
};

interface SkinShopProps {
  coins: number;
  userId: string;
  activeSkin: string;
  onBuySkin: (skin: CatSkin) => void;
  onEquipSkin: (skinId: string) => void;
  ownedSkins: string[];
}

export default function SkinShop({ coins, userId, activeSkin, onBuySkin, onEquipSkin, ownedSkins }: SkinShopProps) {
  const [boughtId, setBoughtId] = useState<string | null>(null);

  const handleBuy = (skin: CatSkin) => {
    if (coins < skin.price || ownedSkins.includes(skin.id)) return;
    onBuySkin(skin);
    setBoughtId(skin.id);
    setTimeout(() => setBoughtId(null), 800);
  };

  const handleEquip = (skinId: string) => {
    if (!ownedSkins.includes(skinId)) return;
    onEquipSkin(skinId);
  };

  return (
    <div className="space-y-4 tab-content-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-extrabold tracking-tight">Katzen-Skins</h2>
        </div>
        <div className="flex items-center gap-1.5 font-extrabold text-coin-foreground bg-accent/50 px-3 py-1 rounded-full text-sm">
          🪙 <span className="tabular-nums">{coins}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Skins geben deiner Katze ein neues Aussehen und einen <strong className="text-primary">permanenten Multiplier-Bonus</strong>!
      </p>

      <div className="grid grid-cols-1 gap-3">
        {CAT_SKINS.map((skin, i) => {
          const owned = ownedSkins.includes(skin.id);
          const equipped = activeSkin === skin.id;
          const canAfford = coins >= skin.price;
          const rarityInfo = RARITY_LABELS[skin.rarity];

          return (
            <div
              key={skin.id}
              className={`game-card p-4 border-2 transition-all section-reveal ${RARITY_COLORS[skin.rarity]} ${
                equipped ? "ring-2 ring-primary" : ""
              } ${boughtId === skin.id ? "scale-[0.97]" : ""}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl flex-shrink-0">{skin.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{skin.name}</span>
                    <span className={`text-[10px] font-bold ${rarityInfo.color}`}>{rarityInfo.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{skin.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {skin.multiplierBonus > 0 && (
                      <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded">
                        +{skin.multiplierBonus.toFixed(1)}× Bonus
                      </span>
                    )}
                    {skin.price > 0 && (
                      <span className="text-[10px] font-bold text-coin-foreground">
                        🪙 {skin.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {equipped ? (
                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <Check className="w-3 h-3" /> Aktiv
                    </span>
                  ) : owned ? (
                    <button
                      onClick={() => handleEquip(skin.id)}
                      className="text-xs font-bold text-foreground bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg transition-colors bounce-click"
                    >
                      Anlegen
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(skin)}
                      disabled={!canAfford}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all bounce-click ${
                        canAfford
                          ? "bg-primary text-primary-foreground hover:opacity-90"
                          : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      }`}
                    >
                      {canAfford ? "Kaufen" : <Lock className="w-3 h-3" />}
                    </button>
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
