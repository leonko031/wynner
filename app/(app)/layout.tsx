import { TopNav } from "@/components/layout/top-nav";
import { GlobalShortcuts } from "@/components/layout/global-shortcuts";
import { PageTransition } from "@/components/layout/page-transition";
import { PremiumCursor } from "@/components/layout/premium-cursor";
import { EasterEggs } from "@/components/layout/easter-eggs";
import { ScanFAB } from "@/components/layout/scan-fab";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { Tour } from "@/components/onboarding/tour";
import { BackupRunner } from "@/components/onboarding/backup-runner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <TopNav />
      <GlobalShortcuts />
      <EasterEggs />
      <PremiumCursor />
      <WelcomeModal />
      <Tour />
      <BackupRunner />
      <PageTransition>{children}</PageTransition>
      <ScanFAB />
    </TooltipProvider>
  );
}
