import { useState, useCallback, useEffect, useRef } from "react";
import { Gamepad2, Search, Trophy, RotateCcw } from "lucide-react";

interface MiniGameScreenProps {
  onReward: (coins: number) => void;
}

// Room items that serve as distractors
const ROOM_ITEMS = [
  { emoji: "🛋️", name: "Sofa" },
  { emoji: "🪴", name: "Pflanze" },
  { emoji: "📚", name: "Bücher" },
  { emoji: "🧸", name: "Teddy" },
  { emoji: "🎨", name: "Bild" },
  { emoji: "🕯️", name: "Kerze" },
  { emoji: "🧶", name: "Wolle" },
  { emoji: "☕", name: "Tasse" },
  { emoji: "🎵", name: "Musik" },
  { emoji: "📦", name: "Karton" },
  { emoji: "🧣", name: "Schal" },
  { emoji: "🪑", name: "Stuhl" },
  { emoji: "🖼️", name: "Rahmen" },
  { emoji: "🎀", name: "Schleife" },
  { emoji: "🧩", name: "Puzzle" },
  { emoji: "🕰️", name: "Uhr" },
  { emoji: "🍂", name: "Blätter" },
  { emoji: "🎈", name: "Ballon" },
  { emoji: "🌸", name: "Blume" },
  { emoji: "📱", name: "Handy" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type GameState = "intro" | "playing" | "found" | "timeout";

export default function MiniGameScreen({ onReward }: MiniGameScreenProps) {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [grid, setGrid] = useState<{ emoji: string; isMouse: boolean }[]>([]);
  const [mouseIndex, setMouseIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(15);
  const [reward, setReward] = useState(0);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const [wrongClicks, setWrongClicks] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback(() => {
    const items = shuffleArray(ROOM_ITEMS).slice(0, 19);
    const cells = items.map((item) => ({ emoji: item.emoji, isMouse: false }));
    const mIdx = Math.floor(Math.random() * 20);
    cells.splice(mIdx, 0, { emoji: "🐭", isMouse: true });
    setGrid(cells);
    setMouseIndex(mIdx);
    setTimeLeft(15);
    setClickedIndex(null);
    setWrongClicks(new Set());
    setGameState("playing");
  }, []);

  // Timer
  useEffect(() => {
    if (gameState !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameState("timeout");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState]);

  const handleClick = (index: number) => {
    if (gameState !== "playing" || clickedIndex !== null) return;
    if (grid[index].isMouse) {
      setClickedIndex(index);
      const bonus = Math.max(5, Math.round(timeLeft * 3));
      setReward(bonus);
      setGameState("found");
      onReward(bonus);
    } else {
      setWrongClicks((prev) => new Set(prev).add(index));
    }
  };

  return (
    <div className="space-y-4 tab-content-enter" key="minigames">
      <div className="flex items-center gap-2">
        <Gamepad2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-extrabold tracking-tight">Mini-Games</h2>
      </div>

      <div className="game-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-extrabold">Maus suchen!</h3>
          </div>
          {gameState === "playing" && (
            <div className={`text-xs font-bold px-2.5 py-1 rounded-full tabular-nums ${
              timeLeft <= 5 ? "bg-destructive/15 text-destructive animate-pulse" : "bg-primary/10 text-primary"
            }`}>
              ⏱ {timeLeft}s
            </div>
          )}
        </div>

        {gameState === "intro" && (
          <div className="text-center space-y-3 py-4">
            <div className="text-5xl">🐭</div>
            <p className="text-sm text-muted-foreground">
              Die Maus hat sich im Wohnzimmer versteckt!<br />
              Finde sie so schnell wie möglich.
            </p>
            <p className="text-xs text-muted-foreground">
              Je schneller du sie findest, desto mehr Coins bekommst du!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm bounce-click"
            >
              🔍 Spiel starten
            </button>
          </div>
        )}

        {gameState === "playing" && (
          <div className="grid grid-cols-5 gap-1.5">
            {grid.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleClick(i)}
                className={`aspect-square rounded-xl text-xl flex items-center justify-center bounce-click transition-all ${
                  wrongClicks.has(i)
                    ? "bg-destructive/10 scale-95"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {cell.emoji}
              </button>
            ))}
          </div>
        )}

        {gameState === "found" && (
          <div className="text-center space-y-3 py-4 animate-scale-in">
            <div className="text-5xl">🎉</div>
            <h3 className="text-lg font-extrabold">Gefunden!</h3>
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="text-xl font-extrabold text-coin-foreground">+{reward} 🪙</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {timeLeft >= 10 ? "Blitzschnell! 🚀" : timeLeft >= 5 ? "Gut gemacht! 👍" : "Gerade noch rechtzeitig! 😅"}
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm bounce-click flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" /> Nochmal spielen
            </button>
          </div>
        )}

        {gameState === "timeout" && (
          <div className="text-center space-y-3 py-4 animate-scale-in">
            <div className="text-5xl">⏰</div>
            <h3 className="text-lg font-extrabold">Zeit abgelaufen!</h3>
            <p className="text-sm text-muted-foreground">Die Maus ist entwischt! Versuch es nochmal.</p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm bounce-click flex items-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" /> Nochmal spielen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
