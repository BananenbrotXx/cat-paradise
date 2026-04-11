import { useState, useCallback, useEffect, useRef } from "react";
import { Target, Trophy, RotateCcw, Clock } from "lucide-react";

interface CatchGameProps {
  onReward: (coins: number) => void;
}

const COOLDOWN_MS = 10 * 60 * 1000;
const GAME_DURATION = 15;
const CAT_EMOJIS = ["🐱", "😺", "😸", "😻", "🙀", "😽", "😹", "🐈", "🐈‍⬛"];

interface FlyingCat {
  id: number;
  emoji: string;
  x: number;
  y: number;
  caught: boolean;
}

type GameState = "intro" | "playing" | "result";

export default function CatchGame({ onReward }: CatchGameProps) {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [cats, setCats] = useState<FlyingCat[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [reward, setReward] = useState(0);
  const nextId = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [cooldownEnd, setCooldownEnd] = useState<number>(() => {
    const saved = localStorage.getItem("catch_cooldown");
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
    localStorage.setItem("catch_cooldown", end.toString());
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
  };

  const spawnCat = useCallback(() => {
    const id = nextId.current++;
    const emoji = CAT_EMOJIS[Math.floor(Math.random() * CAT_EMOJIS.length)];
    const x = 5 + Math.random() * 75;
    const y = 5 + Math.random() * 70;
    setCats((prev) => {
      const filtered = prev.filter((c) => !c.caught).slice(-8); // keep max 9
      return [...filtered, { id, emoji, x, y, caught: false }];
    });
    // Auto-remove after 2s
    setTimeout(() => {
      setCats((prev) => prev.filter((c) => c.id !== id));
    }, 2000);
  }, []);

  const startGame = useCallback(() => {
    if (cooldownEnd > Date.now()) return;
    cleanup();
    setCats([]);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    nextId.current = 0;
    setGameState("playing");
  }, [cooldownEnd]);

  useEffect(() => {
    if (gameState !== "playing") { cleanup(); return; }

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameState("result");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    spawnRef.current = setInterval(spawnCat, 700);

    return cleanup;
  }, [gameState, spawnCat]);

  // Calculate reward on result
  useEffect(() => {
    if (gameState === "result" && score > 0) {
      const bonus = score * 3;
      setReward(bonus);
      onReward(bonus);
      startCooldown();
    }
  }, [gameState]);

  const catchCat = (id: number) => {
    setCats((prev) => prev.map((c) => c.id === id ? { ...c, caught: true } : c));
    setScore((s) => s + 1);
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
          <Target className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-extrabold">Katzen fangen!</h3>
        </div>
        {gameState === "playing" && (
          <div className={`text-xs font-bold px-2.5 py-1 rounded-full tabular-nums ${
            timeLeft <= 5 ? "bg-destructive/15 text-destructive animate-pulse" : "bg-rose-500/10 text-rose-600"
          }`}>
            ⏱ {timeLeft}s · {score} 🐱
          </div>
        )}
      </div>

      {gameState === "intro" && (
        <div className="text-center space-y-3 py-4">
          <div className="text-5xl">🐱</div>
          <p className="text-sm text-muted-foreground">
            Tippe die Katzen bevor sie verschwinden!<br />
            Je mehr du fängst, desto mehr Coins!
          </p>
          {onCooldown ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-bold tabular-nums">Nächstes Spiel in {formatCooldown(cooldownLeft)}</span>
            </div>
          ) : (
            <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm bounce-click">
              🎯 Spiel starten
            </button>
          )}
        </div>
      )}

      {gameState === "playing" && (
        <div
          className="relative w-full rounded-2xl overflow-hidden border-2 border-border"
          style={{ height: "260px", background: "linear-gradient(135deg, hsl(var(--muted) / 0.3), hsl(var(--accent) / 0.3))" }}
        >
          {cats.filter((c) => !c.caught).map((cat) => (
            <button
              key={cat.id}
              onClick={() => catchCat(cat.id)}
              className="absolute text-3xl transition-all duration-150 hover:scale-125 active:scale-75 animate-bounce cursor-pointer"
              style={{
                left: `${cat.x}%`,
                top: `${cat.y}%`,
                animation: "bounce 0.6s ease-in-out infinite",
              }}
            >
              {cat.emoji}
            </button>
          ))}
          {cats.filter((c) => c.caught).map((cat) => (
            <span
              key={`caught-${cat.id}`}
              className="absolute text-2xl opacity-30 scale-50 pointer-events-none transition-all"
              style={{ left: `${cat.x}%`, top: `${cat.y}%` }}
            >
              ✨
            </span>
          ))}
        </div>
      )}

      {gameState === "result" && (
        <div className="text-center space-y-3 py-4 animate-scale-in">
          <div className="text-5xl">{score >= 15 ? "🏆" : score >= 8 ? "⭐" : "🐱"}</div>
          <h3 className="text-lg font-extrabold">{score} Katzen gefangen!</h3>
          <p className="text-xs text-muted-foreground">
            {score >= 15 ? "Unglaublich schnell!" : score >= 8 ? "Tolle Reflexe!" : "Nächstes Mal schaffst du mehr!"}
          </p>
          {reward > 0 && (
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-rose-500" />
              <span className="text-xl font-extrabold text-coin-foreground">+{reward} 🪙</span>
            </div>
          )}
          {onCooldown ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-bold tabular-nums">Nächstes Spiel in {formatCooldown(cooldownLeft)}</span>
            </div>
          ) : (
            <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm bounce-click flex items-center gap-2 mx-auto">
              <RotateCcw className="w-4 h-4" /> Nochmal spielen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
