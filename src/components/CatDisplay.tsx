import { useEffect, useState } from "react";
import type { CatMood } from "@/hooks/useCatGame";
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
}

function getCatImage(mood: CatMood, lastInteraction: string | null) {
  if (lastInteraction === "play") return catPlaying;
  if (mood === "tired" || mood === "sad" || mood === "hungry") return catTired;
  return catHappy;
}

function getMoodEmoji(mood: CatMood) {
  switch (mood) {
    case "happy": return "😻";
    case "content": return "😺";
    case "tired": return "😴";
    case "hungry": return "😿";
    case "sad": return "😢";
  }
}

function getMoodLabel(mood: CatMood) {
  switch (mood) {
    case "happy": return "Überglücklich";
    case "content": return "Zufrieden";
    case "tired": return "Müde";
    case "hungry": return "Hungrig";
    case "sad": return "Traurig";
  }
}

export default function CatDisplay({ mood, isAnimating, lastInteraction, floatingCoins, floatingHearts, onPet }: CatDisplayProps) {
  const [showImage, setShowImage] = useState(catHappy);

  useEffect(() => {
    setShowImage(getCatImage(mood, lastInteraction));
  }, [mood, lastInteraction]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Floating coins */}
      {floatingCoins.map((coin) => (
        <div
          key={coin.id}
          className="absolute top-1/4 left-1/2 pointer-events-none z-10 font-bold text-coin-foreground"
          style={{ animation: "coin-pop 1s ease-out forwards" }}
        >
          +{coin.amount} 🪙
        </div>
      ))}

      {/* Floating hearts */}
      {floatingHearts.map((id) => (
        <div
          key={id}
          className="absolute top-1/3 pointer-events-none z-10 text-2xl"
          style={{
            left: `${40 + Math.random() * 20}%`,
            animation: "heart-float 1s ease-out forwards",
          }}
        >
          ❤️
        </div>
      ))}

      {/* Mood badge */}
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-card px-4 py-1.5 shadow-sm text-sm font-semibold">
        <span>{getMoodEmoji(mood)}</span>
        <span>{getMoodLabel(mood)}</span>
      </div>

      {/* Cat image */}
      <button
        onClick={onPet}
        className="relative cursor-pointer focus:outline-none bounce-click"
        aria-label="Katze streicheln"
      >
        <img
          src={showImage}
          alt="Deine Katze"
          className={`w-56 h-56 object-contain drop-shadow-lg transition-transform duration-300 ${
            isAnimating ? "animate-wiggle" : "animate-float"
          }`}
        />
      </button>

      <p className="mt-2 text-sm text-muted-foreground">Klicke auf die Katze zum Streicheln!</p>
    </div>
  );
}
