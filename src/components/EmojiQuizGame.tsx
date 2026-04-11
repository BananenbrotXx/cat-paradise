import { useState, useCallback, useEffect } from "react";
import { HelpCircle, Trophy, RotateCcw, Clock } from "lucide-react";

interface EmojiQuizGameProps {
  onReward: (coins: number) => void;
}

const COOLDOWN_MS = 10 * 60 * 1000;

interface QuizQuestion {
  emojis: string;
  answer: string;
  options: string[];
}

const ALL_QUESTIONS: QuizQuestion[] = [
  { emojis: "🐱🏠", answer: "Hauskatze", options: ["Hauskatze", "Katzencafé", "Tierheim", "Wildkatze"] },
  { emojis: "🐱💤", answer: "Katzenschlaf", options: ["Nachtwache", "Katzenschlaf", "Mittagspause", "Traumfänger"] },
  { emojis: "🐱🐟", answer: "Fischfang", options: ["Aquarium", "Sushi", "Fischfang", "Angeln"] },
  { emojis: "🐱👑", answer: "Katzenkönig", options: ["Löwe", "Katzenkönig", "Prinzessin", "Tierkönig"] },
  { emojis: "🐱🧶", answer: "Wollknäuel", options: ["Stricken", "Wollknäuel", "Nähkurs", "Spielzeit"] },
  { emojis: "🐱🌙", answer: "Nachtkatze", options: ["Mondschein", "Nachtkatze", "Fledermaus", "Eule"] },
  { emojis: "🐱🎵", answer: "Schnurren", options: ["Konzert", "Vogelgesang", "Schnurren", "Katzenjammer"] },
  { emojis: "🐱❄️", answer: "Winterkatze", options: ["Schneemann", "Winterkatze", "Eisbär", "Iglubau"] },
  { emojis: "🐱🎂", answer: "Katzengeburtstag", options: ["Party", "Katzengeburtstag", "Kuchenfest", "Tierparty"] },
  { emojis: "🐱🦋", answer: "Schmetterlingsjagd", options: ["Frühling", "Schmetterlingsjagd", "Garten", "Insektenkunde"] },
  { emojis: "🐱📦", answer: "Kartonkatze", options: ["Umzug", "Paket", "Kartonkatze", "Lager"] },
  { emojis: "🐱🪞", answer: "Spiegelbild", options: ["Doppelgänger", "Spiegelbild", "Zwilling", "Reflexion"] },
  { emojis: "🐱🌿", answer: "Katzenminze", options: ["Kräutergarten", "Katzenminze", "Salat", "Dschungel"] },
  { emojis: "🐱🎃", answer: "Halloweenkatze", options: ["Geisterkatze", "Kürbis", "Halloweenkatze", "Hexentier"] },
  { emojis: "🐱⛵", answer: "Schiffskatze", options: ["Pirat", "Schiffskatze", "Seemann", "Fischkutter"] },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type GameState = "intro" | "playing" | "correct" | "wrong" | "result";

export default function EmojiQuizGame({ onReward }: EmojiQuizGameProps) {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [reward, setReward] = useState(0);

  const [cooldownEnd, setCooldownEnd] = useState<number>(() => {
    const saved = localStorage.getItem("emojiquiz_cooldown");
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
    localStorage.setItem("emojiquiz_cooldown", end.toString());
  };

  const startGame = useCallback(() => {
    if (cooldownEnd > Date.now()) return;
    const picked = shuffleArray(ALL_QUESTIONS).slice(0, 5);
    setQuestions(picked);
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setGameState("playing");
  }, [cooldownEnd]);

  const handleAnswer = (answer: string) => {
    if (selected) return;
    setSelected(answer);
    const correct = answer === questions[currentQ].answer;
    if (correct) setScore((s) => s + 1);
    setGameState(correct ? "correct" : "wrong");

    setTimeout(() => {
      const next = currentQ + 1;
      if (next >= questions.length) {
        const finalScore = correct ? score + 1 : score;
        const bonus = finalScore * 8;
        setReward(bonus);
        setGameState("result");
        if (bonus > 0) onReward(bonus);
        startCooldown();
      } else {
        setCurrentQ(next);
        setSelected(null);
        setGameState("playing");
      }
    }, 1200);
  };

  const formatCooldown = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const q = questions[currentQ];

  return (
    <div className="game-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-extrabold">Emoji Quiz</h3>
        </div>
        {gameState === "playing" && (
          <span className="text-xs font-bold bg-violet-500/10 text-violet-600 px-2.5 py-1 rounded-full">
            {currentQ + 1}/{questions.length}
          </span>
        )}
      </div>

      {gameState === "intro" && (
        <div className="text-center space-y-3 py-4">
          <div className="text-5xl">🤔</div>
          <p className="text-sm text-muted-foreground">
            Was bedeuten die Emojis?<br />
            5 Fragen — jede richtige Antwort gibt Coins!
          </p>
          {onCooldown ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-bold tabular-nums">Nächstes Spiel in {formatCooldown(cooldownLeft)}</span>
            </div>
          ) : (
            <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-violet-500 text-white font-bold text-sm bounce-click">
              🤔 Quiz starten
            </button>
          )}
        </div>
      )}

      {(gameState === "playing" || gameState === "correct" || gameState === "wrong") && q && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <span className="text-5xl">{q.emojis}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {q.options.map((opt) => {
              let cls = "bg-muted/60 border-2 border-border hover:border-violet-500/50";
              if (selected) {
                if (opt === q.answer) cls = "bg-green-100 dark:bg-green-900/30 border-2 border-green-500";
                else if (opt === selected) cls = "bg-destructive/10 border-2 border-destructive";
                else cls = "bg-muted/30 border-2 border-border opacity-50";
              }
              return (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!selected}
                  className={`py-3 px-2 rounded-xl text-sm font-bold transition-all ${cls}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="flex justify-center gap-1.5">
            {questions.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${
                i < currentQ ? "bg-green-500" : i === currentQ ? "bg-violet-500" : "bg-muted"
              }`} />
            ))}
          </div>
        </div>
      )}

      {gameState === "result" && (
        <div className="text-center space-y-3 py-4 animate-scale-in">
          <div className="text-5xl">{score >= 4 ? "🌟" : score >= 2 ? "👍" : "📚"}</div>
          <h3 className="text-lg font-extrabold">{score}/{questions.length} richtig!</h3>
          <p className="text-xs text-muted-foreground">
            {score === 5 ? "Perfekt! Du bist ein Emoji-Profi!" : score >= 3 ? "Gut gemacht!" : "Übung macht den Meister!"}
          </p>
          {reward > 0 && (
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-violet-500" />
              <span className="text-xl font-extrabold text-coin-foreground">+{reward} 🪙</span>
            </div>
          )}
          {onCooldown ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-bold tabular-nums">Nächstes Spiel in {formatCooldown(cooldownLeft)}</span>
            </div>
          ) : (
            <button onClick={startGame} className="px-6 py-2.5 rounded-xl bg-violet-500 text-white font-bold text-sm bounce-click flex items-center gap-2 mx-auto">
              <RotateCcw className="w-4 h-4" /> Nochmal spielen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
