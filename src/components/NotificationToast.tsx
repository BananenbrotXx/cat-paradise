import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface NotificationToastProps {
  message: string | null;
}

export default function NotificationToast({ message }: NotificationToastProps) {
  const [visible, setVisible] = useState(false);
  const [displayMsg, setDisplayMsg] = useState("");

  useEffect(() => {
    if (message) {
      setDisplayMsg(message);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
      <div className="bg-card border border-border rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 tab-content-enter">
        <span className="text-sm font-bold flex-1">{displayMsg}</span>
        <button onClick={() => setVisible(false)} className="text-muted-foreground hover:text-foreground bounce-click">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
