import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpdatePrompt() {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setNeedsUpdate(true);
            }
          });
        });
      });
    }
  }, []);

  if (!needsUpdate) return null;

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6 text-center shadow-elevated">
        <RefreshCw className="mx-auto h-12 w-12 text-primary" />
        <h2 className="text-h2">Atualização disponível</h2>
        <p className="text-sm text-muted-foreground">
          Uma nova versão do GTBI está disponível. Para continuar usando o
          sistema, é necessário atualizar.
        </p>
        <Button onClick={handleUpdate} className="w-full">
          Atualizar agora
        </Button>
      </div>
    </div>
  );
}
