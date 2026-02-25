import { AppProviders } from "./providers";
import { AppRouter } from "./router";
import { OnboardingProvider } from "@/features/onboarding";
import { OfflineIndicator } from "@/components/common/OfflineIndicator";
import { InstallBanner } from "@/components/common/InstallBanner";
import { UpdatePrompt } from "@/components/common/UpdatePrompt";
import { NotificationStack } from "@/components/common/NotificationStack";
import { WhatsAppDisconnectBanner } from "@/components/common/WhatsAppDisconnectBanner";
import { Toaster } from "@/components/ui/toaster";

export function App() {
  return (
    <AppProviders>
      <OnboardingProvider>
        <AppRouter />
        <Toaster />
        <NotificationStack>
          <OfflineIndicator />
          <WhatsAppDisconnectBanner />
          <InstallBanner />
        </NotificationStack>
        <UpdatePrompt />
      </OnboardingProvider>
    </AppProviders>
  );
}
