import { Heart, Gamepad2, Moon, Clock } from "lucide-react";
import { getCooldownRemaining, formatCooldown, type ActionCooldowns } from "@/hooks/useCatGame";

const ACTION_COOLDOWN = 30;

interface ActionButtonsProps {
  onPet: () => void;
  onPlay: () => void;
  onRest: () => void;
  energy: number;
  actionCooldowns: ActionCooldowns;
}

const ACTION_STYLES = {
  secondary: { bg: "bg-secondary/12", hover: "hover:bg-secondary/20", text: "text-secondary", border: "border-secondary/20" },
  primary: { bg: "bg-primary/12", hover: "hover:bg-primary/20", text: "text-primary", border: "border-primary/20" },
  energy: { bg: "bg-energy/12", hover: "hover:bg-energy/20", text: "text-energy", border: "border-energy/20" },
};

export default function ActionButtons({ onPet, onPlay, onRest, energy, actionCooldowns }: ActionButtonsProps) {
  const petCd = getCooldownRemaining(actionCooldowns.pet, ACTION_COOLDOWN);
  const playCd = getCooldownRemaining(actionCooldowns.play, ACTION_COOLDOWN);
  const restCd = getCooldownRemaining(actionCooldowns.rest, ACTION_COOLDOWN);

  const actions = [
    { label: "Streicheln", emoji: "💝", icon: Heart, color: "secondary" as const, onClick: onPet, cd: petCd, disabled: petCd > 0, reward: "+3 🪙" },
    { label: "Spielen", emoji: "🎾", icon: Gamepad2, color: "primary" as const, onClick: onPlay, cd: playCd, disabled: playCd > 0 || energy < 10, reward: "+5 🪙" },
    { label: "Schlafen", emoji: "🌙", icon: Moon, color: "energy" as const, onClick: onRest, cd: restCd, disabled: restCd > 0, reward: "+25 ⚡" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 section-reveal section-reveal-delay-2">
      {actions.map((a) => {
        const style = ACTION_STYLES[a.color];
        return (
          <button
            key={a.label}
            onClick={a.onClick}
            disabled={a.disabled}
            className={`game-card flex flex-col items-center gap-2 p-4 bounce-click group disabled:opacity-40 disabled:cursor-not-allowed border ${a.disabled ? "border-border" : style.border}`}
          >
            <div className={`w-11 h-11 rounded-2xl ${style.bg} ${style.hover} flex items-center justify-center transition-all duration-200`}>
              {a.cd > 0 ? (
                <Clock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <span className="text-xl">{a.emoji}</span>
              )}
            </div>
            <span className="text-xs font-bold">{a.label}</span>
            {a.cd > 0 ? (
              <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{formatCooldown(a.cd)}</span>
            ) : (
              <span className={`text-[10px] font-bold ${style.text}`}>{a.reward}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
