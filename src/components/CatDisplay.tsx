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
  happy: { emoji: "😻", label: "Überglücklich", color: "bg-health/15 text-health border border-health/20" },
  content: { emoji: "😺", label: "Zufrieden", color: "bg-primary/12 text-primary border border-primary/20" },
  tired: { emoji: "😴", label: "Müde", color: "bg-energy/12 text-energy border border-energy/20" },
  hungry: { emoji: "😿", label: "Hungrig", color: "bg-hunger/12 text-hunger border border-hunger/20" },
  sad: { emoji: "😢", label: "Traurig", color: "bg-muted text-muted-foreground border border-border" },
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
          className="absolute top-1/4 left-1/2 pointer-events-none z-10 font-extrabold text-coin-foreground animate-coin-pop text-sm"
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
          💖
        </div>
      ))}

      {/* Level + Mood badges */}
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 border border-primary/20 px-3 py-1 text-xs font-extrabold text-primary">
          ⭐ Lv.{level}
        </div>
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${moodCfg.color}`}>
          {moodCfg.emoji} {moodCfg.label}
        </div>
      </div>

      {/* Cat image with kawaii background */}
      <button
        onClick={onPet}
        className="relative cursor-pointer focus:outline-none bounce-click group"
        aria-label="Katze streicheln"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 scale-125 group-hover:scale-130 transition-transform duration-500" />
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/15 scale-[1.15] animate-[spin_20s_linear_infinite]" />
        <img
          src={showImage}
          alt="Deine Katze"
          className={`relative w-52 h-52 object-contain drop-shadow-[0_8px_24px_rgba(200,150,200,0.25)] transition-transform duration-300 ${skinClass} ${
            isAnimating ? "animate-wiggle" : "animate-float"
          }`}
        />
      </button>

      {/* XP bar */}
      <div className="w-48 mt-3">
        <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1">
          <span className="flex items-center gap-1">✨ XP</span>
          <span className="tabular-nums">{xp}/{xpToNext}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-primary/10 overflow-hidden border border-primary/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out relative"
            style={{ width: `${xpPercent}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground font-semibold">Tippe auf Mochi zum Streicheln! 💕</p>
    </div>
  );
}
