import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 md:bottom-4">
      <div className="flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm text-destructive-foreground shadow-elevated">
        <WifiOff className="h-4 w-4" />
        <span>Sem conexão</span>
      </div>
    </div>
  );
}
