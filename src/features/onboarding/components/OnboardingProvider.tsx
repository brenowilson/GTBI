import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { OnboardingOverlay } from "./OnboardingOverlay";

const ONBOARDING_STORAGE_KEY = "gtbi_onboarding_complete";

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && !localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setShowOnboarding(false);
  };

  return (
    <>
      {children}
      {showOnboarding && <OnboardingOverlay onComplete={handleComplete} />}
    </>
  );
}
