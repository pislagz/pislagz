"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";
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
    "--skill-icon-filter": theme.skillFilter,
  } as CSSProperties;

  return (
    <div className={styles.shell} style={style}>
      {children}
    </div>
  );
}
