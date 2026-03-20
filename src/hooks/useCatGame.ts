import { useState, useCallback, useEffect, useRef } from "react";

export type CatMood = "happy" | "content" | "tired" | "hungry" | "sad";
export type GameTab = "cat" | "village" | "shop" | "quests";

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  type: "food" | "toy" | "decor";
  description: string;
  hungerRestore?: number;
  happinessBoost?: number;
  energyBoost?: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward: number;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  type: "pet" | "play" | "feed" | "buy" | "visit" | "rest";
}

export interface VillageLocation {
  id: string;
  name: string;
  icon: string;
  description: string;
  action: string;
  cooldown: number; // seconds
  lastVisited: number | null;
  coinReward: number;
  statBoost: { hunger?: number; happiness?: number; energy?: number };
}

export interface CatState {
  name: string;
  hunger: number;
  happiness: number;
  energy: number;
  coins: number;
  mood: CatMood;
  multiplier: number;
  lastInteraction: string | null;
  totalInteractions: number;
  level: number;
  xp: number;
  xpToNext: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "kibble", name: "Trockenfutter", emoji: "🥣", price: 5, type: "food", description: "Einfach aber nahrhaft", hungerRestore: 20, energyBoost: 5 },
  { id: "fish", name: "Frischer Fisch", emoji: "🐟", price: 15, type: "food", description: "Mochis Lieblingsessen!", hungerRestore: 40, happinessBoost: 10, energyBoost: 10 },
  { id: "treat", name: "Leckerli", emoji: "🍖", price: 8, type: "food", description: "Ein kleiner Snack", hungerRestore: 10, happinessBoost: 15 },
  { id: "milk", name: "Warme Milch", emoji: "🥛", price: 10, type: "food", description: "Beruhigt und wärmt", hungerRestore: 15, energyBoost: 20 },
  { id: "sushi", name: "Katzen-Sushi", emoji: "🍣", price: 25, type: "food", description: "Premium Delikatesse", hungerRestore: 50, happinessBoost: 20, energyBoost: 15 },
  { id: "ball", name: "Wollknäuel", emoji: "🧶", price: 20, type: "toy", description: "Stundenlanger Spaß", happinessBoost: 25, energyBoost: -10 },
  { id: "mouse", name: "Spielzeugmaus", emoji: "🐭", price: 30, type: "toy", description: "Quietscht beim Fangen!", happinessBoost: 35, energyBoost: -15 },
  { id: "laser", name: "Laserpointer", emoji: "🔴", price: 50, type: "toy", description: "Der ultimative Jäger-Modus", happinessBoost: 50, energyBoost: -20 },
  { id: "box", name: "Karton", emoji: "📦", price: 12, type: "toy", description: "Wenn ich passe, sitze ich!", happinessBoost: 30, energyBoost: 5 },
  { id: "feather", name: "Federstab", emoji: "🪶", price: 18, type: "toy", description: "Elegant und fesselnd", happinessBoost: 20, energyBoost: -5 },
  { id: "cushion", name: "Kuschelkissen", emoji: "🛋️", price: 35, type: "decor", description: "Extra Komfort zum Schlafen", happinessBoost: 15, energyBoost: 30 },
  { id: "plant", name: "Katzenminze", emoji: "🌿", price: 22, type: "decor", description: "Berauschend gut!", happinessBoost: 40, energyBoost: -5 },
];

const INITIAL_QUESTS: Quest[] = [
  { id: "q1", title: "Schmusekater", description: "Streichle Mochi 5 Mal", icon: "💝", reward: 15, target: 5, progress: 0, completed: false, claimed: false, type: "pet" },
  { id: "q2", title: "Spielzeit!", description: "Spiele 3 Mal mit Mochi", icon: "🎾", reward: 20, target: 3, progress: 0, completed: false, claimed: false, type: "play" },
  { id: "q3", title: "Guten Appetit", description: "Kaufe 2 Futter-Items", icon: "🍽️", reward: 12, target: 2, progress: 0, completed: false, claimed: false, type: "feed" },
  { id: "q4", title: "Shopping-Tour", description: "Kaufe 3 beliebige Items", icon: "🛍️", reward: 25, target: 3, progress: 0, completed: false, claimed: false, type: "buy" },
  { id: "q5", title: "Dorf-Erkunder", description: "Besuche 2 Orte im Dorf", icon: "🗺️", reward: 30, target: 2, progress: 0, completed: false, claimed: false, type: "visit" },
  { id: "q6", title: "Gute Nacht", description: "Lass Mochi 3 Mal ruhen", icon: "😴", reward: 18, target: 3, progress: 0, completed: false, claimed: false, type: "rest" },
];

const VILLAGE_LOCATIONS: VillageLocation[] = [
  { id: "park", name: "Katzenpark", icon: "🌳", description: "Ein grüner Ort zum Erkunden und Schmetterlinge jagen.", action: "Erkunden", cooldown: 30, lastVisited: null, coinReward: 8, statBoost: { happiness: 12, energy: -8 } },
  { id: "market", name: "Fischmarkt", icon: "🐟", description: "Frischer Fang des Tages! Probier eine Kostprobe.", action: "Probieren", cooldown: 45, lastVisited: null, coinReward: 5, statBoost: { hunger: 20, happiness: 5 } },
  { id: "library", name: "Gemütliche Bibliothek", icon: "📚", description: "Ein ruhiger Ort zum Ausruhen zwischen den Bücherregalen.", action: "Nickerchen", cooldown: 60, lastVisited: null, coinReward: 6, statBoost: { energy: 25, happiness: 8 } },
  { id: "fountain", name: "Dorfbrunnen", icon: "⛲", description: "Das Plätschern des Wassers beruhigt die Seele.", action: "Trinken", cooldown: 20, lastVisited: null, coinReward: 4, statBoost: { hunger: 5, energy: 10, happiness: 10 } },
  { id: "bakery", name: "Katzenbäckerei", icon: "🧁", description: "Der Duft von frischen Leckerlis liegt in der Luft!", action: "Naschen", cooldown: 40, lastVisited: null, coinReward: 7, statBoost: { hunger: 15, happiness: 15 } },
  { id: "garden", name: "Kräutergarten", icon: "🌻", description: "Katzenminze und duftende Blumen soweit das Auge reicht.", action: "Schnüffeln", cooldown: 35, lastVisited: null, coinReward: 10, statBoost: { happiness: 20, energy: -3 } },
];

function calculateMood(state: Pick<CatState, "hunger" | "happiness" | "energy">): CatMood {
  const avg = (state.hunger + state.happiness + state.energy) / 3;
  if (avg >= 75) return "happy";
  if (avg >= 55) return "content";
  if (state.hunger < 25) return "hungry";
  if (state.energy < 25) return "tired";
  return "sad";
}

function calculateMultiplier(state: Pick<CatState, "hunger" | "happiness" | "energy">): number {
  const avg = (state.hunger + state.happiness + state.energy) / 3;
  if (avg >= 80) return 3.0;
  if (avg >= 60) return 2.0;
  if (avg >= 40) return 1.5;
  return 1.0;
}

function xpForLevel(level: number) {
  return Math.floor(50 * Math.pow(1.4, level - 1));
}

const INITIAL_STATE: CatState = {
  name: "Mochi",
  hunger: 70,
  happiness: 60,
  energy: 80,
  coins: 30,
  mood: "content",
  multiplier: 1.5,
  lastInteraction: null,
  totalInteractions: 0,
  level: 1,
  xp: 0,
  xpToNext: 50,
};

export function useCatGame() {
  const [cat, setCat] = useState<CatState>(INITIAL_STATE);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [village, setVillage] = useState<VillageLocation[]>(VILLAGE_LOCATIONS);
  const [activeTab, setActiveTab] = useState<GameTab>("cat");
  const [floatingCoins, setFloatingCoins] = useState<{ id: number; amount: number }[]>([]);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const coinIdRef = useRef(0);

  // Decay stats over time
  useEffect(() => {
    const interval = setInterval(() => {
      setCat((prev) => {
        const next = {
          ...prev,
          hunger: Math.max(0, prev.hunger - 0.8),
          happiness: Math.max(0, prev.happiness - 0.4),
          energy: Math.min(100, prev.energy + 0.25),
        };
        next.mood = calculateMood(next);
        next.multiplier = calculateMultiplier(next);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update village cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      setVillage((prev) => prev.map((loc) => ({ ...loc })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  }, []);

  const addXp = useCallback((amount: number) => {
    setCat((prev) => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNext;
      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel++;
        newXpToNext = xpForLevel(newLevel);
      }
      if (newLevel > prev.level) {
        showNotification(`🎉 Level ${newLevel} erreicht!`);
      }
      return { ...prev, xp: newXp, level: newLevel, xpToNext: newXpToNext };
    });
  }, [showNotification]);

  const updateQuestProgress = useCallback((type: Quest["type"], amount = 1) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.type === type && !q.completed) {
          const newProgress = Math.min(q.target, q.progress + amount);
          const completed = newProgress >= q.target;
          if (completed && !q.completed) {
            showNotification(`✨ Quest abgeschlossen: ${q.title}!`);
          }
          return { ...q, progress: newProgress, completed };
        }
        return q;
      })
    );
  }, [showNotification]);

  const claimQuest = useCallback((questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return;

    setQuests((prev) => prev.map((q) => q.id === questId ? { ...q, claimed: true } : q));
    setCat((prev) => ({
      ...prev,
      coins: prev.coins + Math.round(quest.reward * prev.multiplier),
    }));
    addXp(quest.reward);
  }, [quests, addXp]);

  const addFloatingCoin = useCallback((amount: number) => {
    const id = ++coinIdRef.current;
    setFloatingCoins((prev) => [...prev, { id, amount }]);
    setTimeout(() => setFloatingCoins((prev) => prev.filter((c) => c.id !== id)), 1000);
  }, []);

  const addFloatingHeart = useCallback(() => {
    const id = ++coinIdRef.current;
    setFloatingHearts((prev) => [...prev, id]);
    setTimeout(() => setFloatingHearts((prev) => prev.filter((h) => h !== id)), 1000);
  }, []);

  const pet = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    setCat((prev) => {
      const baseReward = 3;
      const reward = Math.round(baseReward * prev.multiplier);
      const next = {
        ...prev,
        happiness: Math.min(100, prev.happiness + 8),
        energy: Math.max(0, prev.energy - 2),
        coins: prev.coins + reward,
        lastInteraction: "pet",
        totalInteractions: prev.totalInteractions + 1,
      };
      next.mood = calculateMood(next);
      next.multiplier = calculateMultiplier(next);
      addFloatingCoin(reward);
      addFloatingHeart();
      return next;
    });
    addXp(2);
    updateQuestProgress("pet");
  }, [isAnimating, addFloatingCoin, addFloatingHeart, addXp, updateQuestProgress]);

  const play = useCallback(() => {
    if (isAnimating) return;
    if (cat.energy < 10) return;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    setCat((prev) => {
      const baseReward = 5;
      const reward = Math.round(baseReward * prev.multiplier);
      const next = {
        ...prev,
        happiness: Math.min(100, prev.happiness + 15),
        energy: Math.max(0, prev.energy - 12),
        hunger: Math.max(0, prev.hunger - 5),
        coins: prev.coins + reward,
        lastInteraction: "play",
        totalInteractions: prev.totalInteractions + 1,
      };
      next.mood = calculateMood(next);
      next.multiplier = calculateMultiplier(next);
      addFloatingCoin(reward);
      return next;
    });
    addXp(3);
    updateQuestProgress("play");
  }, [isAnimating, cat.energy, addFloatingCoin, addXp, updateQuestProgress]);

  const rest = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    setCat((prev) => {
      const baseReward = 2;
      const reward = Math.round(baseReward * prev.multiplier);
      const next = {
        ...prev,
        energy: Math.min(100, prev.energy + 25),
        happiness: Math.min(100, prev.happiness + 3),
        coins: prev.coins + reward,
        lastInteraction: "rest",
        totalInteractions: prev.totalInteractions + 1,
      };
      next.mood = calculateMood(next);
      next.multiplier = calculateMultiplier(next);
      addFloatingCoin(reward);
      return next;
    });
    addXp(1);
    updateQuestProgress("rest");
  }, [isAnimating, addFloatingCoin, addXp, updateQuestProgress]);

  const buyItem = useCallback((item: ShopItem) => {
    if (cat.coins < item.price) return false;

    setCat((prev) => {
      const next = {
        ...prev,
        coins: prev.coins - item.price,
        hunger: Math.min(100, prev.hunger + (item.hungerRestore || 0)),
        happiness: Math.min(100, prev.happiness + (item.happinessBoost || 0)),
        energy: Math.min(100, Math.max(0, prev.energy + (item.energyBoost || 0))),
      };
      next.mood = calculateMood(next);
      next.multiplier = calculateMultiplier(next);
      return next;
    });
    addXp(2);
    updateQuestProgress("buy");
    if (item.type === "food") updateQuestProgress("feed");
    return true;
  }, [cat.coins, addXp, updateQuestProgress]);

  const visitLocation = useCallback((locationId: string) => {
    const now = Date.now();
    const loc = village.find((l) => l.id === locationId);
    if (!loc) return false;

    if (loc.lastVisited && (now - loc.lastVisited) / 1000 < loc.cooldown) return false;

    setVillage((prev) =>
      prev.map((l) => l.id === locationId ? { ...l, lastVisited: now } : l)
    );

    setCat((prev) => {
      const reward = Math.round(loc.coinReward * prev.multiplier);
      const next = {
        ...prev,
        coins: prev.coins + reward,
        hunger: Math.min(100, prev.hunger + (loc.statBoost.hunger || 0)),
        happiness: Math.min(100, prev.happiness + (loc.statBoost.happiness || 0)),
        energy: Math.min(100, Math.max(0, prev.energy + (loc.statBoost.energy || 0))),
      };
      next.mood = calculateMood(next);
      next.multiplier = calculateMultiplier(next);
      addFloatingCoin(reward);
      return next;
    });
    addXp(4);
    updateQuestProgress("visit");
    return true;
  }, [village, addFloatingCoin, addXp, updateQuestProgress]);

  const completedQuests = quests.filter((q) => q.completed).length;
  const totalQuests = quests.length;

  return {
    cat,
    quests,
    village,
    activeTab,
    setActiveTab,
    pet,
    play,
    rest,
    buyItem,
    visitLocation,
    claimQuest,
    isAnimating,
    floatingCoins,
    floatingHearts,
    notification,
    completedQuests,
    totalQuests,
  };
}
