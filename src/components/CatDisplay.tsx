import { useEffect, useState } from "react";
import type { CatMood } from "@/hooks/useCatGame";
import { CAT_SKINS } from "@/components/SkinShop";
import catHappy from "@/assets/cat-happy.png";
import catTired from "@/assets/cat-tired.png";
import catPlaying from "@/assets/cat-playing.png";

interface CatDisplayProps {
  mood: CatMood;
  isAnimating: boolean;
  lastInteraction: string | null;
  floatingCoins: { id: number; amount: number }[];
  floatingHearts: number[];
  onPet: () => void;
  level: number;
  xp: number;
  xpToNext: number;
  activeSkin?: string;
}

function getCatImage(mood: CatMood, lastInteraction: string | null) {
  if (lastInteraction === "play") return catPlaying;
  if (mood === "tired" || mood === "sad" || mood === "hungry") return catTired;
  return catHappy;
}

const MOOD_CONFIG: Record<CatMood, { emoji: string; label: string; color: string }> = {
  happy: { emoji: "😻", label: "Überglücklich", color: "bg-health/20 text-health" },
  content: { emoji: "😺", label: "Zufrieden", color: "bg-primary/15 text-primary" },
  tired: { emoji: "😴", label: "Müde", color: "bg-energy/15 text-energy" },
  hungry: { emoji: "😿", label: "Hungrig", color: "bg-hunger/15 text-hunger" },
  sad: { emoji: "😢", label: "Traurig", color: "bg-muted text-muted-foreground" },
};

export default function CatDisplay({ mood, isAnimating, lastInteraction, floatingCoins, floatingHearts, onPet, level, xp, xpToNext, activeSkin = "default" }: CatDisplayProps) {
  const [showImage, setShowImage] = useState(catHappy);
  const moodCfg = MOOD_CONFIG[mood];
  const skinData = CAT_SKINS.find(s => s.id === activeSkin);
  const skinClass = skinData?.cssClass || "";

  useEffect(() => {
    setShowImage(getCatImage(mood, lastInteraction));
  }, [mood, lastInteraction]);

  const xpPercent = (xp / xpToNext) * 100;

  return (
    <div className="relative flex flex-col items-center section-reveal">
      {/* Floating coins */}
      {floatingCoins.map((coin) => (
        <div
          key={coin.id}
          className="absolute top-1/4 left-1/2 pointer-events-none z-10 font-bold text-coin-foreground animate-coin-pop"
        >
          +{coin.amount} 🪙
        </div>
      ))}

      {/* Floating hearts */}
      {floatingHearts.map((id) => (
        <div
          key={id}
          className="absolute top-1/3 pointer-events-none z-10 text-2xl animate-heart-float"
          style={{ left: `${40 + Math.random() * 20}%` }}
        >
          ❤️
        </div>
      ))}

      {/* Level + Mood badges */}
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          ⭐ Lv.{level}
        </div>
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${moodCfg.color}`}>
          {moodCfg.emoji} {moodCfg.label}
        </div>
      </div>

      {/* Cat image */}
      <button
        onClick={onPet}
        className="relative cursor-pointer focus:outline-none bounce-click group"
        aria-label="Katze streicheln"
      >
        <div className="absolute inset-0 rounded-full bg-primary/5 scale-110 group-hover:bg-primary/10 transition-colors duration-300" />
        <img
          src={showImage}
          alt="Deine Katze"
          className={`relative w-52 h-52 object-contain drop-shadow-lg transition-transform duration-300 ${
            isAnimating ? "animate-wiggle" : "animate-float"
          }`}
        />
      </button>

      {/* XP bar */}
      <div className="w-48 mt-3">
        <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mb-1">
          <span>XP</span>
          <span className="tabular-nums">{xp}/{xpToNext}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">Tippe auf Mochi zum Streicheln!</p>
    </div>
  );
}
