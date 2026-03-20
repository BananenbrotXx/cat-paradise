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

export default function ActionButtons({ onPet, onPlay, onRest, energy, actionCooldowns }: ActionButtonsProps) {
  const petCd = getCooldownRemaining(actionCooldowns.pet, ACTION_COOLDOWN);
  const playCd = getCooldownRemaining(actionCooldowns.play, ACTION_COOLDOWN);
  const restCd = getCooldownRemaining(actionCooldowns.rest, ACTION_COOLDOWN);

  const actions = [
    { label: "Streicheln", icon: Heart, color: "secondary", onClick: onPet, cd: petCd, disabled: petCd > 0, reward: "+3🪙" },
    { label: "Spielen", icon: Gamepad2, color: "primary", onClick: onPlay, cd: playCd, disabled: playCd > 0 || energy < 10, reward: "+5🪙" },
    { label: "Ausruhen", icon: Moon, color: "energy", onClick: onRest, cd: restCd, disabled: restCd > 0, reward: "+25⚡" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5 section-reveal section-reveal-delay-2">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.label}
            onClick={a.onClick}
            disabled={a.disabled}
            className={`game-card flex flex-col items-center gap-2 p-4 bounce-click group disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className={`w-10 h-10 rounded-xl bg-${a.color}/15 flex items-center justify-center group-hover:bg-${a.color}/25 transition-colors`}>
              {a.cd > 0 ? (
                <Clock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Icon className={`w-5 h-5 text-${a.color}`} />
              )}
            </div>
            <span className="text-xs font-bold">{a.label}</span>
            {a.cd > 0 ? (
              <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{formatCooldown(a.cd)}</span>
            ) : (
              <span className="text-[10px] text-muted-foreground">{a.reward}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
