import { useState, useCallback, useEffect, useRef } from "react";
import { Gamepad2, Search, Trophy, RotateCcw, Clock } from "lucide-react";

interface MiniGameScreenProps {
  onReward: (coins: number) => void;
}

const COOLDOWN_MS = 10 * 60 * 1000;

const ROOM_ITEMS = [
  { emoji: "🛋️", name: "Sofa", size: "text-4xl" },
  { emoji: "🪴", name: "Pflanze", size: "text-3xl" },
  { emoji: "📚", name: "Bücher", size: "text-2xl" },
  { emoji: "🧸", name: "Teddy", size: "text-3xl" },
  { emoji: "🎨", name: "Bild", size: "text-2xl" },
  { emoji: "🕯️", name: "Kerze", size: "text-xl" },
  { emoji: "🧶", name: "Wolle", size: "text-2xl" },
  { emoji: "☕", name: "Tasse", size: "text-xl" },
  { emoji: "🎵", name: "Musik", size: "text-xl" },
  { emoji: "📦", name: "Karton", size: "text-3xl" },
  { emoji: "🧣", name: "Schal", size: "text-2xl" },
  { emoji: "🪑", name: "Stuhl", size: "text-3xl" },
  { emoji: "🖼️", name: "Rahmen", size: "text-2xl" },
  { emoji: "🎀", name: "Schleife", size: "text-xl" },
  { emoji: "🧩", name: "Puzzle", size: "text-xl" },
  { emoji: "🕰️", name: "Uhr", size: "text-2xl" },
  { emoji: "🍂", name: "Blätter", size: "text-xl" },
  { emoji: "🎈", name: "Ballon", size: "text-2xl" },
  { emoji: "🌸", name: "Blume", size: "text-xl" },
  { emoji: "📱", name: "Handy", size: "text-xl" },
  { emoji: "🪞", name: "Spiegel", size: "text-2xl" },
  { emoji: "🎁", name: "Geschenk", size: "text-2xl" },
  { emoji: "🧴", name: "Flasche", size: "text-xl" },
  { emoji: "🪣", name: "Eimer", size: "text-2xl" },
  { emoji: "🎭", name: "Maske", size: "text-xl" },
  { emoji: "🔑", name: "Schlüssel", size: "text-xl" },
  { emoji: "🪆", name: "Puppe", size: "text-xl" },
  { emoji: "🧲", name: "Magnet", size: "text-xl" },
];

// Scattered positions for a wimmelbild feel — each item gets a unique spot
const SCATTER_POSITIONS = [
  { top: "2%", left: "5%" }, { top: "5%", left: "55%" }, { top: "8%", left: "30%" },
  { top: "3%", left: "78%" }, { top: "15%", left: "12%" }, { top: "18%", left: "65%" },
  { top: "12%", left: "42%" }, { top: "22%", left: "2%" }, { top: "20%", left: "82%" },
  { top: "28%", left: "25%" }, { top: "25%", left: "55%" }, { top: "32%", left: "8%" },
  { top: "30%", left: "72%" }, { top: "35%", left: "40%" }, { top: "38%", left: "15%" },
  { top: "40%", left: "60%" }, { top: "42%", left: "85%" }, { top: "48%", left: "5%" },
  { top: "45%", left: "35%" }, { top: "50%", left: "70%" }, { top: "55%", left: "20%" },
  { top: "52%", left: "50%" }, { top: "58%", left: "78%" }, { top: "60%", left: "8%" },
  { top: "62%", left: "42%" }, { top: "65%", left: "65%" }, { top: "68%", left: "25%" },
  { top: "72%", left: "52%" }, { top: "70%", left: "85%" }, { top: "75%", left: "10%" },
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

interface WimmelItem {
  emoji: string;
  size: string;
  isMouse: boolean;
  top: string;
  left: string;
  rotation: number;
}

export default function MiniGameScreen({ onReward }: MiniGameScreenProps) {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [items, setItems] = useState<WimmelItem[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [reward, setReward] = useState(0);
  const [foundIndex, setFoundIndex] = useState<number | null>(null);
  const [wrongClicks, setWrongClicks] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cooldownEnd, setCooldownEnd] = useState<number>(() => {
    const saved = localStorage.getItem("minigame_cooldown");
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
    localStorage.setItem("minigame_cooldown", end.toString());
  };

  const startGame = useCallback(() => {
    if (cooldownEnd > Date.now()) return;
    const shuffledItems = shuffleArray(ROOM_ITEMS).slice(0, 24);
    const positions = shuffleArray([...SCATTER_POSITIONS]).slice(0, 25);
    const mousePos = Math.floor(Math.random() * 25);

    const wimmelItems: WimmelItem[] = [];
    let itemIdx = 0;
    for (let i = 0; i < 25; i++) {
      if (i === mousePos) {
        wimmelItems.push({
          emoji: "🐭",
          size: "text-lg",
          isMouse: true,
          top: positions[i].top,
          left: positions[i].left,
          rotation: Math.floor(Math.random() * 40) - 20,
        });
      } else {
        const item = shuffledItems[itemIdx++];
        wimmelItems.push({
          emoji: item.emoji,
          size: item.size,
          isMouse: false,
          top: positions[i].top,
          left: positions[i].left,
          rotation: Math.floor(Math.random() * 30) - 15,
        });
      }
    }

    setItems(wimmelItems);
    setTimeLeft(15);
    setFoundIndex(null);
    setWrongClicks(new Set());
    setGameState("playing");
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

  const handleClick = (index: number) => {
    if (gameState !== "playing" || foundIndex !== null) return;
    if (items[index].isMouse) {
      setFoundIndex(index);
      const bonus = Math.max(5, Math.round(timeLeft * 3));
      setReward(bonus);
      setGameState("found");
      onReward(bonus);
      startCooldown();
    } else {
      setWrongClicks((prev) => new Set(prev).add(index));
    }
  };

  const formatCooldown = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4 tab-content-enter" key="minigames">
      <div className="flex items-center gap-2">
        <Gamepad2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-extrabold tracking-tight">Mini-Games</h2>
        <span className="text-[10px] font-bold bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">BETA</span>
      </div>

      <div className="game-card p-4 rounded-xl bg-secondary/5 border border-secondary/20 text-center">
        <p className="text-xs text-muted-foreground">
          🚧 Dieser Bereich ist noch in der <strong className="text-secondary">Beta</strong> — neue Spiele kommen bald!
        </p>
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
              Finde sie im Wimmelbild!
            </p>
            <p className="text-xs text-muted-foreground">
              Je schneller du sie findest, desto mehr Coins bekommst du!
            </p>
            {onCooldown ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-bold tabular-nums">Nächstes Spiel in {formatCooldown(cooldownLeft)}</span>
              </div>
            ) : (
              <button
                onClick={startGame}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm bounce-click"
              >
                🔍 Spiel starten
              </button>
            )}
          </div>
        )}

        {gameState === "playing" && (
          <div
            className="relative w-full rounded-2xl overflow-hidden border-2 border-border"
            style={{ height: "340px", background: "linear-gradient(to bottom, hsl(var(--muted) / 0.3), hsl(var(--accent) / 0.2))" }}
            style={{ height: "340px" }}
          >
            {/* Room background elements */}
            <div className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, hsl(var(--primary)) 20px, hsl(var(--primary)) 21px)",
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-amber-100/40 to-transparent rounded-b-2xl" />
            <div className="absolute top-0 left-0 right-0 h-[15%] bg-gradient-to-b from-orange-100/30 to-transparent" />

            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => handleClick(i)}
                className={`absolute transition-all duration-200 cursor-pointer hover:scale-125 hover:z-20 ${item.size} ${
                  foundIndex === i
                    ? "scale-150 z-30 drop-shadow-[0_0_12px_hsl(var(--primary))]"
                    : wrongClicks.has(i)
                    ? "opacity-40 scale-90"
                    : "hover:drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                }`}
                style={{
                  top: item.top,
                  left: item.left,
                  transform: `rotate(${item.rotation}deg)`,
                  zIndex: wrongClicks.has(i) ? 1 : foundIndex === i ? 30 : 10,
                }}
              >
                {item.emoji}
              </button>
            ))}

            {/* Hint text */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground/60 bg-background/60 backdrop-blur-sm px-3 py-1 rounded-full">
              🐭 Finde die Maus!
            </div>
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
            {onCooldown ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-bold tabular-nums">Nächstes Spiel in {formatCooldown(cooldownLeft)}</span>
              </div>
            ) : (
              <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm bounce-click flex items-center gap-2 mx-auto">
                <RotateCcw className="w-4 h-4" /> Nochmal spielen
              </button>
            )}
          </div>
        )}

        {gameState === "timeout" && (
          <div className="text-center space-y-3 py-4 animate-scale-in">
            <div className="text-5xl">⏰</div>
            <h3 className="text-lg font-extrabold">Zeit abgelaufen!</h3>
            <p className="text-sm text-muted-foreground">Die Maus ist entwischt! Versuch es nochmal.</p>
            <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm bounce-click flex items-center gap-2 mx-auto">
              <RotateCcw className="w-4 h-4" /> Nochmal spielen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
