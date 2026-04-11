import { useState, useRef, useCallback, useEffect } from "react";
import { Zap, Trophy, RotateCcw, Clock } from "lucide-react";

interface ReactionGameProps {
  onReward: (coins: number) => void;
}

const COOLDOWN_MS = 10 * 60 * 1000;
type GameState = "intro" | "waiting" | "ready" | "result" | "too_early";

export default function ReactionGame({ onReward }: ReactionGameProps) {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [reactionTime, setReactionTime] = useState(0);
  const [reward, setReward] = useState(0);
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const readyAt = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cooldownEnd, setCooldownEnd] = useState<number>(() => {
    const saved = localStorage.getItem("reaction_cooldown");
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
    localStorage.setItem("reaction_cooldown", end.toString());
  };

  const startRound = useCallback(() => {
    setGameState("waiting");
    const delay = 1500 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      readyAt.current = Date.now();
      setGameState("ready");
    }, delay);
  }, []);

  const startGame = useCallback(() => {
    if (cooldownEnd > Date.now()) return;
    setTimes([]);
    setRound(0);
    startRound();
  }, [cooldownEnd, startRound]);

  const handleTap = () => {
    if (gameState === "waiting") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setGameState("too_early");
      return;
    }
    if (gameState === "ready") {
      const ms = Date.now() - readyAt.current;
      const newTimes = [...times, ms];
      setTimes(newTimes);
      setReactionTime(ms);
      const newRound = round + 1;
      setRound(newRound);

      if (newRound >= 3) {
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        const bonus = Math.max(5, Math.round(50 - avg / 10));
        setReward(bonus);
        setReactionTime(avg);
        setGameState("result");
        onReward(bonus);
        startCooldown();
      } else {
        setTimeout(startRound, 800);
        setGameState("intro"); // brief pause
        setTimeout(() => {}, 500);
        // Show brief result then continue
        setGameState("too_early"); // reuse as "show time" state briefly
        setTimeout(() => startRound(), 1000);
      }
    }
  };

  const formatCooldown = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getColor = () => {
    if (gameState === "waiting") return "bg-destructive";
    if (gameState === "ready") return "bg-green-500";
    return "bg-muted";
  };

  return (
    <div className="game-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-extrabold">Reaktionstest</h3>
        {round > 0 && round < 3 && gameState !== "result" && (
          <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full">{round}/3</span>
        )}
      </div>

      {gameState === "intro" && (
        <div className="text-center space-y-3 py-4">
          <div className="text-5xl">⚡</div>
          <p className="text-sm text-muted-foreground">
            Tippe so schnell wie möglich wenn der<br />Bildschirm <span className="text-green-500 font-bold">grün</span> wird!
          </p>
          <p className="text-xs text-muted-foreground">3 Runden — Durchschnitt zählt!</p>
          {onCooldown ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-bold tabular-nums">Nächstes Spiel in {formatCooldown(cooldownLeft)}</span>
            </div>
          ) : (
            <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm bounce-click">
              ⚡ Spiel starten
            </button>
          )}
        </div>
      )}

      {(gameState === "waiting" || gameState === "ready") && (
        <button
          onClick={handleTap}
          className={`w-full rounded-2xl transition-colors duration-200 flex items-center justify-center ${getColor()}`}
          style={{ height: "180px" }}
        >
          <span className="text-white font-extrabold text-lg">
            {gameState === "waiting" ? "Warte..." : "JETZT TIPPEN!"}
          </span>
        </button>
      )}

      {gameState === "too_early" && round < 3 && (
        <div className="text-center space-y-3 py-4">
          <div className="text-3xl">⏱️</div>
          <p className="text-sm font-bold">{reactionTime > 0 ? `${reactionTime}ms` : "Zu früh!"}</p>
          {reactionTime === 0 && (
            <button onClick={startRound} className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm bounce-click">
              Nochmal
            </button>
          )}
        </div>
      )}

      {gameState === "result" && (
        <div className="text-center space-y-3 py-4 animate-scale-in">
          <div className="text-5xl">{reactionTime < 300 ? "🚀" : reactionTime < 500 ? "👍" : "🐢"}</div>
          <h3 className="text-lg font-extrabold">Ø {reactionTime}ms</h3>
          <p className="text-xs text-muted-foreground">
            {reactionTime < 250 ? "Blitzschnell!" : reactionTime < 400 ? "Gute Reflexe!" : "Übung macht den Meister!"}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="text-xl font-extrabold text-coin-foreground">+{reward} 🪙</span>
          </div>
          {onCooldown ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-bold tabular-nums">Nächstes Spiel in {formatCooldown(cooldownLeft)}</span>
            </div>
          ) : (
            <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm bounce-click flex items-center gap-2 mx-auto">
              <RotateCcw className="w-4 h-4" /> Nochmal spielen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
