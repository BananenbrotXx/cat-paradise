import { useState, useCallback, useEffect, useRef } from "react";
import { Brain, Trophy, RotateCcw, Clock } from "lucide-react";

interface MemoryGameProps {
  onReward: (coins: number) => void;
}

const COOLDOWN_MS = 10 * 60 * 1000;

const CAT_EMOJIS = ["🐱", "😺", "😸", "😻", "🙀", "😽", "😹", "🐈"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type GameState = "intro" | "playing" | "won" | "timeout";

export default function MemoryGame({ onReward }: MemoryGameProps) {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [reward, setReward] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockRef = useRef(false);

  const [cooldownEnd, setCooldownEnd] = useState<number>(() => {
    const saved = localStorage.getItem("memory_cooldown");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const onCooldown = cooldownLeft > 0;

  useEffect(() => {
    const tick = () => setCooldownLeft(Math.max(0, cooldownEnd - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cooldownEnd]);

  const startCooldown = () => {
    const end = Date.now() + COOLDOWN_MS;
    setCooldownEnd(end);
    localStorage.setItem("memory_cooldown", end.toString());
  };

  const startGame = useCallback(() => {
    if (cooldownEnd > Date.now()) return;
    const pairs = shuffleArray(CAT_EMOJIS).slice(0, 6);
    const deck = shuffleArray([...pairs, ...pairs]).map((emoji, i) => ({
      id: i,
      emoji,
      flipped: false,
      matched: false,
    }));
    setCards(deck);
    setFlippedIds([]);
    setMoves(0);
    setTimeLeft(60);
    setGameState("playing");
    lockRef.current = false;
  }, [cooldownEnd]);

  useEffect(() => {
    if (gameState !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setGameState("timeout"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState]);

  // Check win
  useEffect(() => {
    if (gameState === "playing" && cards.length > 0 && cards.every((c) => c.matched)) {
      const bonus = Math.max(10, Math.round(timeLeft * 2) - moves);
      setReward(bonus);
      setGameState("won");
      onReward(bonus);
      startCooldown();
    }
  }, [cards, gameState]);

  const handleCardClick = (id: number) => {
    if (lockRef.current || gameState !== "playing") return;
    const card = cards[id];
    if (card.flipped || card.matched) return;

    const newCards = cards.map((c) => c.id === id ? { ...c, flipped: true } : c);
    const newFlipped = [...flippedIds, id];
    setCards(newCards);
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      lockRef.current = true;
      const [first, second] = newFlipped;
      if (newCards[first].emoji === newCards[second].emoji) {
        // Match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first || c.id === second ? { ...c, matched: true } : c
            )
          );
          setFlippedIds([]);
          lockRef.current = false;
        }, 400);
      } else {
        // No match — flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first || c.id === second ? { ...c, flipped: false } : c
            )
          );
          setFlippedIds([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  const formatCooldown = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="game-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-secondary" />
          <h3 className="text-sm font-extrabold">Katzen Memory</h3>
        </div>
        {gameState === "playing" && (
          <div className={`text-xs font-bold px-2.5 py-1 rounded-full tabular-nums ${
            timeLeft <= 10 ? "bg-destructive/15 text-destructive animate-pulse" : "bg-secondary/10 text-secondary"
          }`}>
            ⏱ {timeLeft}s · {moves} Züge
          </div>
        )}
      </div>

      {gameState === "intro" && (
        <div className="text-center space-y-3 py-4">
          <div className="text-5xl">🧠</div>
          <p className="text-sm text-muted-foreground">
            Finde alle Katzen-Paare!<br />
            Je weniger Züge, desto mehr Coins!
          </p>
          {onCooldown ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-bold tabular-nums">Nächstes Spiel in {formatCooldown(cooldownLeft)}</span>
            </div>
          ) : (
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm bounce-click"
            >
              🧠 Spiel starten
            </button>
          )}
        </div>
      )}

      {gameState === "playing" && (
        <div className="grid grid-cols-4 gap-2">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square rounded-xl text-2xl font-bold flex items-center justify-center transition-all duration-300 ${
                card.matched
                  ? "bg-green-100 dark:bg-green-900/30 scale-90 opacity-60"
                  : card.flipped
                  ? "bg-secondary/20 border-2 border-secondary scale-105"
                  : "bg-muted/60 border-2 border-border hover:border-secondary/50 hover:bg-muted active:scale-95"
              }`}
            >
              {card.flipped || card.matched ? card.emoji : "❓"}
            </button>
          ))}
        </div>
      )}

      {gameState === "won" && (
        <div className="text-center space-y-3 py-4 animate-scale-in">
          <div className="text-5xl">🏆</div>
          <h3 className="text-lg font-extrabold">Alle Paare gefunden!</h3>
          <p className="text-sm text-muted-foreground">In {moves} Zügen mit {timeLeft}s übrig</p>
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-secondary" />
            <span className="text-xl font-extrabold text-coin-foreground">+{reward} 🪙</span>
          </div>
          {onCooldown ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-bold tabular-nums">Nächstes Spiel in {formatCooldown(cooldownLeft)}</span>
            </div>
          ) : (
            <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm bounce-click flex items-center gap-2 mx-auto">
              <RotateCcw className="w-4 h-4" /> Nochmal spielen
            </button>
          )}
        </div>
      )}

      {gameState === "timeout" && (
        <div className="text-center space-y-3 py-4 animate-scale-in">
          <div className="text-5xl">⏰</div>
          <h3 className="text-lg font-extrabold">Zeit abgelaufen!</h3>
          <p className="text-sm text-muted-foreground">Versuch es nochmal — du schaffst das!</p>
          <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm bounce-click flex items-center gap-2 mx-auto">
            <RotateCcw className="w-4 h-4" /> Nochmal spielen
          </button>
        </div>
      )}
    </div>
  );
}
