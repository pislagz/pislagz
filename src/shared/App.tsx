import type { ReactNode } from "react";
import { DeveloperSettingsProvider } from "@shared/developer/DeveloperSettings";
import { ErrorBoundary } from "@shared/errors";
import { FooterSlot } from "./components/FooterSlot";
import { GoldenSpiralOverlay } from "./components/GoldenSpiralOverlay";
import { Header } from "./components/Header";
import { MobileScrollSafeArea } from "./components/MobileScrollSafeArea";
import { PageBackground } from "./components/PageBackground";
import { ThemeShell } from "./ThemeShell";
import styles from "./App.module.css";

type Props = {
  children: ReactNode;
};

export function App({ children }: Props) {
  return (
    <ErrorBoundary>
      <DeveloperSettingsProvider>
        <ThemeShell>
          <PageBackground />
          <GoldenSpiralOverlay />
          <Header />
          <main className={styles.main}>{children}</main>
          <FooterSlot />
          <MobileScrollSafeArea />
        </ThemeShell>
      </DeveloperSettingsProvider>
    </ErrorBoundary>
  );
}
