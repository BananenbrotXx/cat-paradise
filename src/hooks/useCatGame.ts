import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CAT_SKINS, type CatSkin } from "@/components/SkinShop";

export type CatMood = "happy" | "content" | "tired" | "hungry" | "sad";
export type GameTab = "cat" | "village" | "shop" | "quests" | "leaderboard" | "admin" | "minigames";

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
  cooldown: number;
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
  activeSkin: string;
}

export interface ActionCooldowns {
  pet: number | null;
  play: number | null;
  rest: number | null;
}

const ACTION_COOLDOWN = 30; // 30 seconds
const VILLAGE_COOLDOWN = 300; // 5 minutes

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
  { id: "park", name: "Katzenpark", icon: "🌳", description: "Ein grüner Ort zum Erkunden und Schmetterlinge jagen.", action: "Erkunden", cooldown: VILLAGE_COOLDOWN, lastVisited: null, coinReward: 8, statBoost: { happiness: 12, energy: -8 } },
  { id: "market", name: "Fischmarkt", icon: "🐟", description: "Frischer Fang des Tages! Probier eine Kostprobe.", action: "Probieren", cooldown: VILLAGE_COOLDOWN, lastVisited: null, coinReward: 5, statBoost: { hunger: 20, happiness: 5 } },
  { id: "library", name: "Gemütliche Bibliothek", icon: "📚", description: "Ein ruhiger Ort zum Ausruhen zwischen den Bücherregalen.", action: "Nickerchen", cooldown: VILLAGE_COOLDOWN, lastVisited: null, coinReward: 6, statBoost: { energy: 25, happiness: 8 } },
  { id: "fountain", name: "Dorfbrunnen", icon: "⛲", description: "Das Plätschern des Wassers beruhigt die Seele.", action: "Trinken", cooldown: VILLAGE_COOLDOWN, lastVisited: null, coinReward: 4, statBoost: { hunger: 5, energy: 10, happiness: 10 } },
  { id: "bakery", name: "Katzenbäckerei", icon: "🧁", description: "Der Duft von frischen Leckerlis liegt in der Luft!", action: "Naschen", cooldown: VILLAGE_COOLDOWN, lastVisited: null, coinReward: 7, statBoost: { hunger: 15, happiness: 15 } },
  { id: "garden", name: "Kräutergarten", icon: "🌻", description: "Katzenminze und duftende Blumen soweit das Auge reicht.", action: "Schnüffeln", cooldown: VILLAGE_COOLDOWN, lastVisited: null, coinReward: 10, statBoost: { happiness: 20, energy: -3 } },
];

function calculateMood(state: Pick<CatState, "hunger" | "happiness" | "energy">): CatMood {
  const avg = (state.hunger + state.happiness + state.energy) / 3;
  if (avg >= 75) return "happy";
  if (avg >= 55) return "content";
  if (state.hunger < 25) return "hungry";
  if (state.energy < 25) return "tired";
  return "sad";
}

function calculateMultiplier(state: Pick<CatState, "hunger" | "happiness" | "energy">, skinBonus = 0): number {
  const avg = (state.hunger + state.happiness + state.energy) / 3;
  let base = 1.0;
  if (avg >= 80) base = 3.0;
  else if (avg >= 60) base = 2.0;
  else if (avg >= 40) base = 1.5;
  return base + skinBonus;
}

function xpForLevel(level: number) {
  return Math.floor(50 * Math.pow(1.4, level - 1));
}

export function getCooldownRemaining(lastTime: number | null, cooldownSec: number): number {
  if (!lastTime) return 0;
  return Math.max(0, Math.ceil(cooldownSec - (Date.now() - lastTime) / 1000));
}

export function formatCooldown(seconds: number): string {
  if (seconds <= 0) return "Bereit!";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
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
  activeSkin: "default",
};

// Get next 00:00 CET reset time
function getNextQuestResetCET(): number {
  const now = new Date();
  // Get current date/time in Europe/Berlin
  const berlinStr = now.toLocaleString("en-GB", { timeZone: "Europe/Berlin", hour12: false });
  // Parse "DD/MM/YYYY, HH:MM:SS"
  const [datePart, timePart] = berlinStr.split(", ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // Calculate next midnight CET: create a date for today midnight CET
  // CET midnight = 23:00 UTC previous day (or 22:00 UTC during CEST)
  // Use a simpler approach: construct "tomorrow 00:00" in Berlin timezone
  const todayMidnightBerlin = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" })
  );
  todayMidnightBerlin.setHours(0, 0, 0, 0);

  // If we haven't passed midnight Berlin yet, reset is today at midnight
  // But since we parsed the time, if hour >= 0 we already passed it
  // So next reset is always tomorrow at 00:00 Berlin
  const tomorrowMidnightBerlin = new Date(todayMidnightBerlin);
  tomorrowMidnightBerlin.setDate(tomorrowMidnightBerlin.getDate() + 1);

  // Convert back: get the UTC offset for Berlin at that time
  // Simple approach: calculate diff between local interpretation and actual now
  const berlinNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const offsetMs = berlinNow.getTime() - now.getTime();

  return tomorrowMidnightBerlin.getTime() - offsetMs;
}

// Helper to load quests from localStorage, with daily reset at 00:00 CET
function loadQuests(userId: string): Quest[] {
  try {
    const saved = localStorage.getItem(`quests_${userId}`);
    const lastReset = localStorage.getItem(`quests_reset_${userId}`);
    if (saved && lastReset) {
      const lastResetTime = parseInt(lastReset, 10);
      // Check if we've passed midnight CET since last reset
      const berlinNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
      const berlinReset = new Date(new Date(lastResetTime).toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
      // If the date (day) changed in Berlin timezone, reset quests
      if (berlinNow.toDateString() !== berlinReset.toDateString()) {
        localStorage.setItem(`quests_reset_${userId}`, Date.now().toString());
        localStorage.setItem(`quests_${userId}`, JSON.stringify(INITIAL_QUESTS));
        return INITIAL_QUESTS;
      }
      const parsed = JSON.parse(saved) as Quest[];
      return INITIAL_QUESTS.map(iq => {
        const s = parsed.find(q => q.id === iq.id);
        return s ? { ...iq, progress: s.progress, completed: s.completed, claimed: s.claimed } : iq;
      });
    }
    // First time — set reset timestamp
    localStorage.setItem(`quests_reset_${userId}`, Date.now().toString());
  } catch {}
  return INITIAL_QUESTS;
}

function loadCooldowns(userId: string): ActionCooldowns {
  try {
    const saved = localStorage.getItem(`cooldowns_${userId}`);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { pet: null, play: null, rest: null };
}

function loadVillageCooldowns(userId: string): VillageLocation[] {
  try {
    const saved = localStorage.getItem(`village_${userId}`);
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, number | null>;
      return VILLAGE_LOCATIONS.map(loc => ({
        ...loc,
        lastVisited: parsed[loc.id] ?? null,
      }));
    }
  } catch {}
  return VILLAGE_LOCATIONS;
}

export function useCatGame(userId?: string | null) {
  const [cat, setCat] = useState<CatState>(INITIAL_STATE);
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [village, setVillage] = useState<VillageLocation[]>(VILLAGE_LOCATIONS);
  const [activeTab, setActiveTab] = useState<GameTab>("cat");
  const [floatingCoins, setFloatingCoins] = useState<{ id: number; amount: number }[]>([]);
  const [floatingHearts, setFloatingHearts] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [actionCooldowns, setActionCooldowns] = useState<ActionCooldowns>({ pet: null, play: null, rest: null });
  const coinIdRef = useRef(0);
  const [, setTick] = useState(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [offlineEarnings, setOfflineEarnings] = useState<{ coins: number; minutes: number } | null>(null);
  const [ownedSkins, setOwnedSkins] = useState<string[]>(["default"]);

  // Load saved game state from database
  useEffect(() => {
    if (!userId) {
      setGameLoaded(false);
      loadedRef.current = false;
      return;
    }
    loadedRef.current = false;
    setGameLoaded(false);
    const load = async () => {
      // Load game save and skins in parallel
      const [saveResult, skinsResult] = await Promise.all([
        supabase.from("game_saves").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("cat_skins").select("skin_id").eq("user_id", userId),
      ]);

      const data = saveResult.data;
      const skinsData = (skinsResult.data as any[]) || [];
      const owned = ["default", ...skinsData.map((s: any) => s.skin_id)];
      setOwnedSkins(owned);

      if (data) {
        const lastOnline = (data as any).last_online ? new Date((data as any).last_online) : null;
        const now = new Date();
        if (lastOnline) {
          const diffMs = now.getTime() - lastOnline.getTime();
          const diffMin = diffMs / 60000;
          if (diffMin >= 2) {
            const baseRate = 0.5 + (data.level * 0.3);
            const happinessBonus = data.happiness / 100;
            const earned = Math.min(500, Math.round(diffMin * baseRate * (0.5 + happinessBonus)));
            if (earned > 0) {
              setOfflineEarnings({ coins: earned, minutes: diffMin });
            }
          }
        }

        const activeSkin = (data as any).active_skin || "default";
        const skinBonus = CAT_SKINS.find(s => s.id === activeSkin)?.multiplierBonus || 0;

        setCat((prev) => {
          const restored = {
            ...prev,
            hunger: data.hunger,
            happiness: data.happiness,
            energy: data.energy,
            coins: data.coins,
            level: data.level,
            xp: data.xp,
            xpToNext: data.xp_to_next,
            totalInteractions: data.total_interactions,
            activeSkin,
          };
          restored.mood = calculateMood(restored);
          restored.multiplier = calculateMultiplier(restored, skinBonus);
          return restored;
        });
      }
      // Load persisted quests, cooldowns, and village from localStorage
      setQuests(loadQuests(userId));
      setActionCooldowns(loadCooldowns(userId));
      setVillage(loadVillageCooldowns(userId));
      
      loadedRef.current = true;
      setGameLoaded(true);
    };
    load();
  }, [userId]);

  // Persist quests to localStorage
  useEffect(() => {
    if (!userId || !loadedRef.current) return;
    localStorage.setItem(`quests_${userId}`, JSON.stringify(quests));
  }, [quests, userId]);

  // Persist action cooldowns to localStorage
  useEffect(() => {
    if (!userId || !loadedRef.current) return;
    localStorage.setItem(`cooldowns_${userId}`, JSON.stringify(actionCooldowns));
  }, [actionCooldowns, userId]);

  // Persist village cooldowns to localStorage
  useEffect(() => {
    if (!userId || !loadedRef.current) return;
    const villageTimes: Record<string, number | null> = {};
    village.forEach(loc => { villageTimes[loc.id] = loc.lastVisited; });
    localStorage.setItem(`village_${userId}`, JSON.stringify(villageTimes));
  }, [village, userId]);

  // Auto-save game state (debounced)
  const saveGame = useCallback((state: CatState) => {
    if (!userId || !loadedRef.current) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const payload = {
        user_id: userId,
        hunger: state.hunger,
        happiness: state.happiness,
        energy: state.energy,
        coins: state.coins,
        level: state.level,
        xp: state.xp,
        xp_to_next: state.xpToNext,
        total_interactions: state.totalInteractions,
        updated_at: new Date().toISOString(),
        last_online: new Date().toISOString(),
        active_skin: state.activeSkin,
      };
      const { data: existing } = await supabase
        .from("game_saves")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) {
        await supabase.from("game_saves").update(payload).eq("user_id", userId);
      } else {
        await supabase.from("game_saves").insert(payload);
      }
    }, 3000);
  }, [userId]);

  // Trigger save whenever cat state changes
  useEffect(() => {
    if (loadedRef.current) saveGame(cat);
  }, [cat, saveGame]);

  // Force re-render for cooldown timers
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Decay stats over time - only after game is loaded
  useEffect(() => {
    if (!gameLoaded) return;
    const interval = setInterval(() => {
      setCat((prev) => {
        const skinBonus = CAT_SKINS.find(s => s.id === prev.activeSkin)?.multiplierBonus || 0;
        const next = {
          ...prev,
          hunger: Math.max(0, prev.hunger - 0.8),
          happiness: Math.max(0, prev.happiness - 0.4),
          energy: Math.min(100, prev.energy + 0.25),
        };
        next.mood = calculateMood(next);
        next.multiplier = calculateMultiplier(next, skinBonus);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [gameLoaded]);

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
    setCat((prev) => ({ ...prev, coins: prev.coins + Math.round(quest.reward * prev.multiplier) }));
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

  const isActionReady = useCallback((action: keyof ActionCooldowns) => {
    return getCooldownRemaining(actionCooldowns[action], ACTION_COOLDOWN) <= 0;
  }, [actionCooldowns]);

  const pet = useCallback(() => {
    if (isAnimating || !isActionReady("pet")) return;
    setIsAnimating(true);
    setActionCooldowns((prev) => ({ ...prev, pet: Date.now() }));
    setTimeout(() => setIsAnimating(false), 600);

    setCat((prev) => {
      const skinBonus = CAT_SKINS.find(s => s.id === prev.activeSkin)?.multiplierBonus || 0;
      const reward = Math.round(3 * prev.multiplier);
      const next = { ...prev, happiness: Math.min(100, prev.happiness + 8), energy: Math.max(0, prev.energy - 2), coins: prev.coins + reward, lastInteraction: "pet", totalInteractions: prev.totalInteractions + 1 };
      next.mood = calculateMood(next);
      next.multiplier = calculateMultiplier(next, skinBonus);
      addFloatingCoin(reward);
      addFloatingHeart();
      return next;
    });
    addXp(2);
    updateQuestProgress("pet");
  }, [isAnimating, isActionReady, addFloatingCoin, addFloatingHeart, addXp, updateQuestProgress]);

  const play = useCallback(() => {
    if (isAnimating || cat.energy < 10 || !isActionReady("play")) return;
    setIsAnimating(true);
    setActionCooldowns((prev) => ({ ...prev, play: Date.now() }));
    setTimeout(() => setIsAnimating(false), 600);

    setCat((prev) => {
      const skinBonus = CAT_SKINS.find(s => s.id === prev.activeSkin)?.multiplierBonus || 0;
      const reward = Math.round(5 * prev.multiplier);
      const next = { ...prev, happiness: Math.min(100, prev.happiness + 15), energy: Math.max(0, prev.energy - 12), hunger: Math.max(0, prev.hunger - 5), coins: prev.coins + reward, lastInteraction: "play", totalInteractions: prev.totalInteractions + 1 };
      next.mood = calculateMood(next);
      next.multiplier = calculateMultiplier(next, skinBonus);
      addFloatingCoin(reward);
      return next;
    });
    addXp(3);
    updateQuestProgress("play");
  }, [isAnimating, cat.energy, isActionReady, addFloatingCoin, addXp, updateQuestProgress]);

  const rest = useCallback(() => {
    if (isAnimating || !isActionReady("rest")) return;
    setIsAnimating(true);
    setActionCooldowns((prev) => ({ ...prev, rest: Date.now() }));
    setTimeout(() => setIsAnimating(false), 600);

    setCat((prev) => {
      const skinBonus = CAT_SKINS.find(s => s.id === prev.activeSkin)?.multiplierBonus || 0;
      const reward = Math.round(2 * prev.multiplier);
      const next = { ...prev, energy: Math.min(100, prev.energy + 25), happiness: Math.min(100, prev.happiness + 3), coins: prev.coins + reward, lastInteraction: "rest", totalInteractions: prev.totalInteractions + 1 };
      next.mood = calculateMood(next);
      next.multiplier = calculateMultiplier(next, skinBonus);
      addFloatingCoin(reward);
      return next;
    });
    addXp(1);
    updateQuestProgress("rest");
  }, [isAnimating, isActionReady, addFloatingCoin, addXp, updateQuestProgress]);

  const buyItem = useCallback((item: ShopItem) => {
    if (cat.coins < item.price) return false;
    setCat((prev) => {
      const skinBonus = CAT_SKINS.find(s => s.id === prev.activeSkin)?.multiplierBonus || 0;
      const next = { ...prev, coins: prev.coins - item.price, hunger: Math.min(100, prev.hunger + (item.hungerRestore || 0)), happiness: Math.min(100, prev.happiness + (item.happinessBoost || 0)), energy: Math.min(100, Math.max(0, prev.energy + (item.energyBoost || 0))) };
      next.mood = calculateMood(next);
      next.multiplier = calculateMultiplier(next, skinBonus);
      return next;
    });
    addXp(2);
    updateQuestProgress("buy");
    if (item.type === "food") updateQuestProgress("feed");
    return true;
  }, [cat.coins, addXp, updateQuestProgress]);

  const visitLocation = useCallback((locationId: string) => {
    const loc = village.find((l) => l.id === locationId);
    if (!loc) return false;
    if (getCooldownRemaining(loc.lastVisited, loc.cooldown) > 0) return false;

    setVillage((prev) => prev.map((l) => l.id === locationId ? { ...l, lastVisited: Date.now() } : l));
    setCat((prev) => {
      const skinBonus = CAT_SKINS.find(s => s.id === prev.activeSkin)?.multiplierBonus || 0;
      const reward = Math.round(loc.coinReward * prev.multiplier);
      const next = { ...prev, coins: prev.coins + reward, hunger: Math.min(100, prev.hunger + (loc.statBoost.hunger || 0)), happiness: Math.min(100, prev.happiness + (loc.statBoost.happiness || 0)), energy: Math.min(100, Math.max(0, prev.energy + (loc.statBoost.energy || 0))) };
      next.mood = calculateMood(next);
      next.multiplier = calculateMultiplier(next, skinBonus);
      addFloatingCoin(reward);
      return next;
    });
    addXp(4);
    updateQuestProgress("visit");
    return true;
  }, [village, addFloatingCoin, addXp, updateQuestProgress]);

  const completedQuests = quests.filter((q) => q.completed).length;

  const skipAllCooldowns = useCallback(() => {
    setActionCooldowns({ pet: null, play: null, rest: null });
    setVillage((prev) => prev.map((l) => ({ ...l, lastVisited: null })));
    localStorage.removeItem("minigame_cooldown");
    localStorage.removeItem("memory_cooldown");
    localStorage.removeItem("reaction_cooldown");
    localStorage.removeItem("emojiquiz_cooldown");
    localStorage.removeItem("catch_cooldown");
    showNotification("⚡ Alle Cooldowns zurückgesetzt!");
  }, [showNotification]);

  const addCoins = useCallback((amount: number) => {
    setCat((prev) => ({ ...prev, coins: prev.coins + amount }));
  }, []);

  const collectOfflineEarnings = useCallback(() => {
    if (offlineEarnings) {
      addCoins(offlineEarnings.coins);
      setOfflineEarnings(null);
    }
  }, [offlineEarnings, addCoins]);

  const buySkin = useCallback((skin: CatSkin) => {
    if (cat.coins < skin.price || ownedSkins.includes(skin.id)) return;
    setCat((prev) => ({
      ...prev,
      coins: prev.coins - skin.price,
      activeSkin: skin.id,
      multiplier: calculateMultiplier(prev, skin.multiplierBonus),
    }));
    setOwnedSkins((prev) => [...prev, skin.id]);
    if (userId) {
      supabase.from("cat_skins").insert({ user_id: userId, skin_id: skin.id }).then(({ error }) => {
        if (error) console.error("Failed to save skin:", error);
      });
    }
    showNotification(`🎨 Skin "${skin.name}" freigeschaltet!`);
  }, [cat.coins, ownedSkins, userId, showNotification]);

  const equipSkin = useCallback((skinId: string) => {
    if (!ownedSkins.includes(skinId)) return;
    const skinBonus = CAT_SKINS.find(s => s.id === skinId)?.multiplierBonus || 0;
    setCat((prev) => ({
      ...prev,
      activeSkin: skinId,
      multiplier: calculateMultiplier(prev, skinBonus),
    }));
    showNotification(`🐱 Skin gewechselt!`);
  }, [ownedSkins, showNotification]);

  const applyRandomEvent = useCallback((effect: { coins?: number; hunger?: number; happiness?: number; energy?: number }) => {
    setCat((prev) => {
      const next = {
        ...prev,
        coins: Math.max(0, prev.coins + (effect.coins || 0)),
        hunger: Math.min(100, Math.max(0, prev.hunger + (effect.hunger || 0))),
        happiness: Math.min(100, Math.max(0, prev.happiness + (effect.happiness || 0))),
        energy: Math.min(100, Math.max(0, prev.energy + (effect.energy || 0))),
      };
      next.mood = calculateMood(next);
      const skinBonus = CAT_SKINS.find(s => s.id === next.activeSkin)?.multiplierBonus || 0;
      next.multiplier = calculateMultiplier(next, skinBonus);
      return next;
    });
  }, []);

  return {
    cat, quests, village, activeTab, setActiveTab,
    pet, play, rest, buyItem, visitLocation, claimQuest,
    isAnimating, floatingCoins, floatingHearts,
    notification, completedQuests, totalQuests: quests.length,
    actionCooldowns, skipAllCooldowns,
    addCoins, offlineEarnings, collectOfflineEarnings,
    gameLoaded, ownedSkins, buySkin, equipSkin, applyRandomEvent,
  };
}
