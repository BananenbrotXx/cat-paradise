import { useEffect, useState, useCallback } from "react";

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  emoji: string;
  effect: {
    coins?: number;
    hunger?: number;
    happiness?: number;
    energy?: number;
  };
  type: "positive" | "negative" | "neutral";
}

const RANDOM_EVENTS: RandomEvent[] = [
  { id: "gift", title: "Geschenk gefunden!", description: "Mochi hat ein kleines Geschenk unter dem Sofa gefunden!", emoji: "🎁", effect: { coins: 25, happiness: 10 }, type: "positive" },
  { id: "visitor", title: "Besuch!", description: "Ein Nachbar kommt vorbei und bringt Leckerlis mit!", emoji: "👋", effect: { coins: 10, hunger: 15, happiness: 8 }, type: "positive" },
  { id: "nap", title: "Power-Nickerchen", description: "Mochi hat ein erholsames Nickerchen gemacht!", emoji: "💤", effect: { energy: 30, happiness: 5 }, type: "positive" },
  { id: "butterfly", title: "Schmetterling!", description: "Mochi jagt einen Schmetterling durchs Zimmer!", emoji: "🦋", effect: { happiness: 20, energy: -10 }, type: "positive" },
  { id: "treasure", title: "Schatz entdeckt!", description: "Hinter dem Bücherregal lagen versteckte Münzen!", emoji: "💰", effect: { coins: 50 }, type: "positive" },
  { id: "rain", title: "Regentag", description: "Es regnet draußen... Mochi ist etwas traurig.", emoji: "🌧️", effect: { happiness: -10, energy: 5 }, type: "negative" },
  { id: "sick", title: "Bauchweh!", description: "Mochi hat zu viel genascht und hat Bauchweh.", emoji: "🤢", effect: { hunger: -15, happiness: -10 }, type: "negative" },
  { id: "noise", title: "Laute Geräusche!", description: "Ein lautes Geräusch hat Mochi erschreckt!", emoji: "😱", effect: { happiness: -12, energy: -8 }, type: "negative" },
  { id: "sunbeam", title: "Sonnenstrahl!", description: "Ein warmer Sonnenstrahl fällt aufs Kissen. Perfekt!", emoji: "☀️", effect: { happiness: 15, energy: 15 }, type: "positive" },
  { id: "bird", title: "Vogel am Fenster", description: "Ein Vogel sitzt am Fenster — Mochi ist fasziniert!", emoji: "🐦", effect: { happiness: 12 }, type: "neutral" },
  { id: "yarn", title: "Wollknäuel gefunden!", description: "Mochi hat ein Wollknäuel gefunden und spielt damit!", emoji: "🧶", effect: { happiness: 18, energy: -5 }, type: "positive" },
  { id: "treat_drop", title: "Leckerli vom Tisch!", description: "Ein Leckerli ist vom Tisch gefallen — Jackpot!", emoji: "🍪", effect: { hunger: 20, happiness: 8 }, type: "positive" },
];

interface RandomEventPopupProps {
  onApplyEvent: (effect: RandomEvent["effect"]) => void;
  gameLoaded: boolean;
}

export default function RandomEventPopup({ onApplyEvent, gameLoaded }: RandomEventPopupProps) {
  const [activeEvent, setActiveEvent] = useState<RandomEvent | null>(null);
  const [visible, setVisible] = useState(false);

  const triggerEvent = useCallback(() => {
    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    setActiveEvent(event);
    setVisible(true);
  }, []);

  // Random event every 10-15 minutes
  useEffect(() => {
    if (!gameLoaded) return;
    const scheduleNext = () => {
      const delay = (600 + Math.random() * 300) * 1000; // 10-15 min
      return setTimeout(() => {
        triggerEvent();
        timerRef = scheduleNext();
      }, delay);
    };
    let timerRef = scheduleNext();
    return () => clearTimeout(timerRef);
  }, [gameLoaded, triggerEvent]);

  const handleCollect = () => {
    if (activeEvent) {
      onApplyEvent(activeEvent.effect);
    }
    setVisible(false);
    setTimeout(() => setActiveEvent(null), 300);
  };

  if (!activeEvent) return null;

  const bgColor = activeEvent.type === "positive"
    ? "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30"
    : activeEvent.type === "negative"
    ? "from-red-500/20 to-red-600/10 border-red-500/30"
    : "from-blue-500/20 to-blue-600/10 border-blue-500/30";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCollect} />
      <div className={`relative bg-gradient-to-br ${bgColor} bg-card border rounded-2xl p-6 max-w-xs w-full shadow-2xl transform transition-all duration-300 ${visible ? "scale-100" : "scale-90"}`}>
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">{activeEvent.emoji}</div>
          <h3 className="text-lg font-extrabold mb-1">{activeEvent.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{activeEvent.description}</p>

          {/* Effects */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {activeEvent.effect.coins && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${activeEvent.effect.coins > 0 ? "bg-yellow-500/20 text-yellow-600" : "bg-red-500/20 text-red-500"}`}>
                {activeEvent.effect.coins > 0 ? "+" : ""}{activeEvent.effect.coins} 🪙
              </span>
            )}
            {activeEvent.effect.hunger && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${activeEvent.effect.hunger > 0 ? "bg-orange-500/20 text-orange-600" : "bg-red-500/20 text-red-500"}`}>
                {activeEvent.effect.hunger > 0 ? "+" : ""}{activeEvent.effect.hunger} 🍗
              </span>
            )}
            {activeEvent.effect.happiness && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${activeEvent.effect.happiness > 0 ? "bg-pink-500/20 text-pink-600" : "bg-red-500/20 text-red-500"}`}>
                {activeEvent.effect.happiness > 0 ? "+" : ""}{activeEvent.effect.happiness} 💕
              </span>
            )}
            {activeEvent.effect.energy && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${activeEvent.effect.energy > 0 ? "bg-blue-500/20 text-blue-600" : "bg-red-500/20 text-red-500"}`}>
                {activeEvent.effect.energy > 0 ? "+" : ""}{activeEvent.effect.energy} ⚡
              </span>
            )}
          </div>

          <button
            onClick={handleCollect}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity bounce-click"
          >
            {activeEvent.type === "negative" ? "Oh nein! 😿" : "Toll! 🎉"}
          </button>
        </div>
      </div>
    </div>
  );
}
