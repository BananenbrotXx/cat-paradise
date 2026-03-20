import { useState, useCallback, useEffect, useRef } from "react";

export type CatMood = "happy" | "content" | "tired" | "hungry" | "sad";

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  type: "food" | "toy";
  hungerRestore?: number;
  happinessBoost?: number;
  energyBoost?: number;
}

export interface CatState {
  name: string;
  hunger: number; // 0-100
  happiness: number; // 0-100
  energy: number; // 0-100
  coins: number;
  mood: CatMood;
  multiplier: number;
  lastInteraction: string | null;
  totalInteractions: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "kibble", name: "Trockenfutter", emoji: "🥣", price: 5, type: "food", hungerRestore: 20, energyBoost: 5 },
  { id: "fish", name: "Frischer Fisch", emoji: "🐟", price: 15, type: "food", hungerRestore: 40, happinessBoost: 10, energyBoost: 10 },
  { id: "treat", name: "Leckerli", emoji: "🍖", price: 8, type: "food", hungerRestore: 10, happinessBoost: 15 },
  { id: "milk", name: "Warme Milch", emoji: "🥛", price: 10, type: "food", hungerRestore: 15, energyBoost: 20 },
  { id: "ball", name: "Wollknäuel", emoji: "🧶", price: 20, type: "toy", happinessBoost: 25, energyBoost: -10 },
  { id: "mouse", name: "Spielzeugmaus", emoji: "🐭", price: 30, type: "toy", happinessBoost: 35, energyBoost: -15 },
  { id: "laser", name: "Laserpointer", emoji: "🔴", price: 50, type: "toy", happinessBoost: 50, energyBoost: -20 },
  { id: "box", name: "Karton", emoji: "📦", price: 12, type: "toy", happinessBoost: 30, energyBoost: 5 },
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

const INITIAL_STATE: CatState = {
  name: "Mochi",
  hunger: 70,
  happiness: 60,
  energy: 80,
  coins: 20,
  mood: "content",
  multiplier: 1.5,
  lastInteraction: null,
  totalInteractions: 0,
};

export function useCatGame() {
  const [cat, setCat] = useState<CatState>(INITIAL_STATE);
  const [floatingCoins, setFloatingCoins] = useState<{ id: number; amount: number }[]>([]);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const coinIdRef = useRef(0);

  // Decay stats over time
  useEffect(() => {
    const interval = setInterval(() => {
      setCat((prev) => {
        const next = {
          ...prev,
          hunger: Math.max(0, prev.hunger - 1),
          happiness: Math.max(0, prev.happiness - 0.5),
          energy: Math.min(100, prev.energy + 0.3),
        };
        next.mood = calculateMood(next);
        next.multiplier = calculateMultiplier(next);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
  }, [isAnimating, addFloatingCoin, addFloatingHeart]);

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
  }, [isAnimating, cat.energy, addFloatingCoin]);

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
  }, [isAnimating, addFloatingCoin]);

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
    return true;
  }, [cat.coins]);

  return {
    cat,
    pet,
    play,
    rest,
    buyItem,
    isAnimating,
    floatingCoins,
    floatingHearts,
  };
}
