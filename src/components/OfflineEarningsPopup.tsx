import { useState } from "react";
import { Clock, X } from "lucide-react";

interface OfflineEarningsPopupProps {
  coins: number;
  minutesAway: number;
  onCollect: () => void;
}

export default function OfflineEarningsPopup({ coins, minutesAway, onCollect }: OfflineEarningsPopupProps) {
  const [collected, setCollected] = useState(false);

  if (coins <= 0) return null;

  const hours = Math.floor(minutesAway / 60);
  const mins = Math.round(minutesAway % 60);
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const handleCollect = () => {
    setCollected(true);
    onCollect();
  };

  if (collected) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="game-card p-6 w-[90%] max-w-sm space-y-4 text-center animate-scale-in">
        <button onClick={handleCollect} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>

        <div className="text-4xl">😺</div>
        <h2 className="text-lg font-extrabold">Willkommen zurück!</h2>
        <p className="text-xs text-muted-foreground">
          Du warst <strong>{timeStr}</strong> weg. Mochi hat für dich gearbeitet!
        </p>

        <div className="flex items-center justify-center gap-2 py-3">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-2xl font-extrabold text-coin-foreground">+{coins} 🪙</span>
        </div>

        <button
          onClick={handleCollect}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm bounce-click"
        >
          Einsammeln!
        </button>
      </div>
    </div>
  );
}
