import { Heart, Gamepad2, Moon } from "lucide-react";

interface ActionButtonsProps {
  onPet: () => void;
  onPlay: () => void;
  onRest: () => void;
  energy: number;
}

export default function ActionButtons({ onPet, onPlay, onRest, energy }: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5 section-reveal section-reveal-delay-2">
      <button
        onClick={onPet}
        className="game-card flex flex-col items-center gap-2 p-4 bounce-click group"
      >
        <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center group-hover:bg-secondary/25 transition-colors">
          <Heart className="w-5 h-5 text-secondary" />
        </div>
        <span className="text-xs font-bold">Streicheln</span>
        <span className="text-[10px] text-muted-foreground">+3🪙</span>
      </button>

      <button
        onClick={onPlay}
        disabled={energy < 10}
        className="game-card flex flex-col items-center gap-2 p-4 bounce-click group disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
          <Gamepad2 className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xs font-bold">Spielen</span>
        <span className="text-[10px] text-muted-foreground">+5🪙</span>
      </button>

      <button
        onClick={onRest}
        className="game-card flex flex-col items-center gap-2 p-4 bounce-click group"
      >
        <div className="w-10 h-10 rounded-xl bg-energy/15 flex items-center justify-center group-hover:bg-energy/25 transition-colors">
          <Moon className="w-5 h-5 text-energy" />
        </div>
        <span className="text-xs font-bold">Ausruhen</span>
        <span className="text-[10px] text-muted-foreground">+25⚡</span>
      </button>
    </div>
  );
}
