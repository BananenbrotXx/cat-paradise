import type { GameTab } from "@/hooks/useCatGame";
import { Cat, MapPin, ShoppingBag, Scroll, Trophy, Shield, Gamepad2 } from "lucide-react";

interface BottomNavProps {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
  questBadge?: number;
  isAdmin?: boolean;
}

const BASE_TABS: { id: GameTab; label: string; icon: React.FC<{ className?: string }>; emoji: string }[] = [
  { id: "cat", label: "Mochi", icon: Cat, emoji: "🐱" },
  { id: "village", label: "Dorf", icon: MapPin, emoji: "🏘️" },
  { id: "shop", label: "Shop", icon: ShoppingBag, emoji: "🛍️" },
  { id: "minigames", label: "Spiele", icon: Gamepad2, emoji: "🎮" },
  { id: "quests", label: "Quests", icon: Scroll, emoji: "📜" },
  { id: "leaderboard", label: "Rang", icon: Trophy, emoji: "🏆" },
];

export default function BottomNav({ activeTab, onTabChange, questBadge, isAdmin }: BottomNavProps) {
  const TABS = isAdmin ? [...BASE_TABS, { id: "admin" as GameTab, label: "Admin", icon: Shield, emoji: "🛡️" }] : BASE_TABS;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-lg border-t-2 border-primary/10">
      <div className="max-w-lg mx-auto flex">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === "quests" && questBadge && questBadge > 0;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-all bounce-click relative ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <span className={`text-lg transition-transform duration-300 inline-block ${isActive ? "scale-125 -translate-y-0.5" : ""}`}>
                  {tab.emoji}
                </span>
                {showBadge && (
                  <div className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-secondary text-[8px] font-extrabold text-primary-foreground flex items-center justify-center animate-bounce-in">
                    {questBadge}
                  </div>
                )}
              </div>
              <span className={`text-[9px] font-bold transition-colors ${isActive ? "text-primary" : ""}`}>{tab.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-primary to-secondary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
