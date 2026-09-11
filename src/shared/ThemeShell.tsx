"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { playArcadeSound } from "./arcade-audio";
import { themeForPath } from "./theme";
import styles from "./App.module.css";

type Props = {
  children: ReactNode;
};

export function ThemeShell({ children }: Props) {
  const theme = themeForPath(usePathname());
  const style = {
    "--color-accent": theme.accent,
    "--color-accent-deep": theme.accentDeep,
    "--shadow-nav": theme.shadowNav,
    "--logo-from": theme.logoFrom,
    "--logo-to": theme.logoTo,
    "--color-underline": theme.underline,
    "--arsenal-icon-filter": theme.arsenalIconFilter,
  } as CSSProperties;

  const playNavigationSound = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest("a[href]");
    if (!link) return;
    const destination = new URL(link.getAttribute("href") ?? "", window.location.href);
    if (destination.origin !== window.location.origin) return;
    playArcadeSound("navigate");
  };

  return (
    <div className={styles.shell} style={style} onClickCapture={playNavigationSound}>
      {children}
    </div>
  );
}
