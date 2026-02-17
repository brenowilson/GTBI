import { AppProviders } from "./providers";
import { AppRouter } from "./router";
import { OfflineIndicator } from "@/components/common/OfflineIndicator";
import { InstallBanner } from "@/components/common/InstallBanner";
import { UpdatePrompt } from "@/components/common/UpdatePrompt";
import { Toaster } from "@/components/ui/toaster";

export function App() {
  return (
    <AppProviders>
      <AppRouter />
      <Toaster />
      <OfflineIndicator />
      <InstallBanner />
      <UpdatePrompt />
    </AppProviders>
  );
}
