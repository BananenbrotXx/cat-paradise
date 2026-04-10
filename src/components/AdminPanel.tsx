import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Search, Ban, Zap, Undo2, Users, Coins } from "lucide-react";

interface AdminPanelProps {
  onSkipCooldowns: () => void;
}

interface BannedEntry {
  user_id: string;
  display_name: string;
  banned_at: string;
}

export default function AdminPanel({ onSkipCooldowns }: AdminPanelProps) {
  const [searchName, setSearchName] = useState("");
  const [banName, setBanName] = useState("");
  const [unbanName, setUnbanName] = useState("");
  const [coinName, setCoinName] = useState("");
  const [coinAmount, setCoinAmount] = useState("");
  const [lookupResult, setLookupResult] = useState<{ email: string; display_name: string } | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [bannedList, setBannedList] = useState<BannedEntry[]>([]);
  const [bannedLoading, setBannedLoading] = useState(true);

  const showMsg = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const callAdmin = async (action: string, params: Record<string, string>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const res = await supabase.functions.invoke("admin-actions", {
      body: { action, ...params },
    });
    return res;
  };

  const fetchBannedList = async () => {
    setBannedLoading(true);
    const res = await callAdmin("list_banned", {});
    if (res?.data && Array.isArray(res.data)) {
      setBannedList(res.data);
    }
    setBannedLoading(false);
  };

  useEffect(() => {
    fetchBannedList();
  }, []);

  const handleLookup = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    setLookupResult(null);
    const res = await callAdmin("lookup_email", { display_name: searchName.trim() });
    setLoading(false);
    if (res?.error || res?.data?.error) {
      showMsg(res?.data?.error || "Fehler", "error");
    } else {
      setLookupResult(res?.data);
    }
  };

  const handleBan = async () => {
    if (!banName.trim()) return;
    setLoading(true);
    const res = await callAdmin("ban_user", { display_name: banName.trim() });
    setLoading(false);
    if (res?.error || res?.data?.error) {
      showMsg(res?.data?.error || "Fehler", "error");
    } else {
      showMsg(`${banName} wurde gebannt!`, "success");
      setBanName("");
      fetchBannedList();
    }
  };

  const handleUnban = async () => {
    if (!unbanName.trim()) return;
    setLoading(true);
    const res = await callAdmin("unban_user", { display_name: unbanName.trim() });
    setLoading(false);
    if (res?.error || res?.data?.error) {
      showMsg(res?.data?.error || "Fehler", "error");
    } else {
      showMsg(`${unbanName} wurde entbannt!`, "success");
      setUnbanName("");
      fetchBannedList();
    }
  };

  const handleGiveCoins = async () => {
    if (!coinName.trim() || !coinAmount) return;
    setLoading(true);
    const res = await callAdmin("give_coins", { display_name: coinName.trim(), amount: coinAmount });
    setLoading(false);
    if (res?.error || res?.data?.error) {
      showMsg(res?.data?.error || "Fehler", "error");
    } else {
      showMsg(`${coinAmount} Münzen an ${coinName} gesendet!`, "success");
      setCoinName("");
      setCoinAmount("");
    }
  };

  return (
    <div className="space-y-4 tab-content-enter" key="admin">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-destructive" />
        <h2 className="text-lg font-extrabold tracking-tight">Admin Panel</h2>
      </div>

      {message && (
        <div className={`game-card p-3 text-sm font-bold ${message.type === "success" ? "text-green-600 bg-green-50" : "text-destructive bg-destructive/10"}`}>
          {message.text}
        </div>
      )}

      {/* Skip Cooldowns */}
      <div className="game-card p-4 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Cooldowns überspringen</h3>
        <button
          onClick={onSkipCooldowns}
          className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-colors active:scale-[0.97]"
        >
          Alle Cooldowns zurücksetzen
        </button>
      </div>

      {/* Email Lookup */}
      <div className="game-card p-4 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2"><Search className="w-4 h-4 text-primary" /> E-Mail nachschlagen</h3>
        <div className="flex gap-2">
          <input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Anzeigename eingeben..."
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          />
          <button onClick={handleLookup} disabled={loading} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50">
            Suchen
          </button>
        </div>
        {lookupResult && (
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <p><span className="font-bold">Name:</span> {lookupResult.display_name}</p>
            <p><span className="font-bold">E-Mail:</span> {lookupResult.email}</p>
          </div>
        )}
      </div>

      {/* Ban User */}
      <div className="game-card p-4 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2"><Ban className="w-4 h-4 text-destructive" /> Spieler bannen</h3>
        <div className="flex gap-2">
          <input
            value={banName}
            onChange={(e) => setBanName(e.target.value)}
            placeholder="Anzeigename eingeben..."
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleBan()}
          />
          <button onClick={handleBan} disabled={loading} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-bold text-sm hover:bg-destructive/90 active:scale-[0.97] disabled:opacity-50">
            Bannen
          </button>
        </div>
      </div>

      {/* Unban User */}
      <div className="game-card p-4 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2"><Undo2 className="w-4 h-4 text-green-600" /> Spieler entbannen</h3>
        <div className="flex gap-2">
          <input
            value={unbanName}
            onChange={(e) => setUnbanName(e.target.value)}
            placeholder="Anzeigename eingeben..."
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleUnban()}
          />
          <button onClick={handleUnban} disabled={loading} className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold text-sm hover:bg-green-700 active:scale-[0.97] disabled:opacity-50">
            Entbannen
          </button>
        </div>
      </div>

      {/* Give Coins */}
      <div className="game-card p-4 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2"><Coins className="w-4 h-4 text-amber-500" /> Münzen geben</h3>
        <div className="flex gap-2">
          <input
            value={coinName}
            onChange={(e) => setCoinName(e.target.value)}
            placeholder="Anzeigename..."
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
          <input
            value={coinAmount}
            onChange={(e) => setCoinAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="Anzahl"
            className="w-20 px-3 py-2 rounded-lg border border-border bg-background text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleGiveCoins()}
          />
        </div>
        <button
          onClick={handleGiveCoins}
          disabled={loading || !coinName.trim() || !coinAmount}
          className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-colors active:scale-[0.97] disabled:opacity-50"
        >
          🪙 Münzen senden
        </button>
      </div>

      {/* Banned Users List */}
      <div className="game-card p-4 space-y-3">
        <h3 className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4 text-destructive" /> Gebannte Spieler ({bannedList.length})</h3>
        {bannedLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-10 rounded-lg bg-muted/50 animate-pulse" />)}
          </div>
        ) : bannedList.length === 0 ? (
          <p className="text-xs text-muted-foreground">Keine gebannten Spieler.</p>
        ) : (
          <div className="space-y-2">
            {bannedList.map((b) => (
              <div key={b.user_id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-bold text-muted-foreground line-through">{b.display_name} 🚫</p>
                  <p className="text-[10px] text-muted-foreground">
                    Gebannt am {new Date(b.banned_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button
                  onClick={() => { setUnbanName(b.display_name); }}
                  className="text-[10px] font-bold text-green-600 hover:underline"
                >
                  Entbannen
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
