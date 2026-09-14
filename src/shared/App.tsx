import type { ReactNode } from "react";
import { ErrorBoundary } from "@shared/errors";
import { Footer } from "./components/Footer";
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
      <ThemeShell>
        <PageBackground />
        <Header />
        <main className={styles.main}>{children}</main>
        <Footer />
        <MobileScrollSafeArea />
      </ThemeShell>
    </ErrorBoundary>
  );
}
