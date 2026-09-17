"use client";

import { useEffect, useState } from "react";
import { playArcadeSound } from "@shared/arcade-audio";
import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import { Button } from "@shared/ui/Button";
import styles from "./PlayTabletCtas.module.css";

const HAMBURGER_QUERY = "(max-width: 1100px)";
const PLAYING_CTA_DELAY_MS = 3500;

type Props = {
  gameActive: boolean;
  pong: boolean;
};

export function PlayTabletCtas({ gameActive, pong }: Props) {
  const { footerEnabled } = useDeveloperSettings();
  const hamburger = useMediaQuery(HAMBURGER_QUERY);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pong || !hamburger || footerEnabled || !gameActive) {
      setVisible(false);
      return;
    }

    const timeout = window.setTimeout(() => setVisible(true), PLAYING_CTA_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [pong, hamburger, footerEnabled, gameActive]);

  if (pong || !hamburger || footerEnabled) return null;

  return (
    <div
      className={`${styles.wrap} ${visible ? styles.wrapVisible : ""}`}
      aria-hidden={!visible}
    >
      <Button
        href="/resume"
        variant="glass"
        className={styles.link}
        onClick={() => playArcadeSound("select")}
      >
        see résumé
      </Button>
      <Button
        href="/hire-me"
        variant="glass"
        className={styles.link}
        onClick={() => playArcadeSound("select")}
      >
        contact me
      </Button>
    </div>
  );
}
