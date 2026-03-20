import type { GameTab } from "@/hooks/useCatGame";
import { Cat, MapPin, ShoppingBag, Scroll, Trophy, Shield } from "lucide-react";

interface BottomNavProps {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
  questBadge?: number;
  isAdmin?: boolean;
}

const BASE_TABS: { id: GameTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "cat", label: "Mochi", icon: Cat },
  { id: "village", label: "Dorf", icon: MapPin },
  { id: "shop", label: "Shop", icon: ShoppingBag },
  { id: "quests", label: "Quests", icon: Scroll },
  { id: "leaderboard", label: "Rangliste", icon: Trophy },
];

export default function BottomNav({ activeTab, onTabChange, questBadge }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/90 backdrop-blur-md border-t border-border">
      <div className="max-w-lg mx-auto flex">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const showBadge = tab.id === "quests" && questBadge && questBadge > 0;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors bounce-click relative ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                {showBadge && (
                  <div className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-quest text-[8px] font-extrabold text-primary-foreground flex items-center justify-center">
                    {questBadge}
                  </div>
                )}
              </div>
              <span className="text-[9px] font-bold">{tab.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
