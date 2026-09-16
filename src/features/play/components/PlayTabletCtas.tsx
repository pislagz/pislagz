"use client";

import { useEffect, useState } from "react";
import { playArcadeSound } from "@shared/arcade-audio";
import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import { Button } from "@shared/ui/Button";
import styles from "./PlayTabletCtas.module.css";

const TABLET_QUERY = "(min-width: 901px) and (max-width: 1100px)";
const PLAYING_CTA_DELAY_MS = 3500;

type Props = {
  gameActive: boolean;
};

export function PlayTabletCtas({ gameActive }: Props) {
  const { footerEnabled } = useDeveloperSettings();
  const tablet = useMediaQuery(TABLET_QUERY);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!tablet || footerEnabled || !gameActive) {
      setVisible(false);
      return;
    }

    const timeout = window.setTimeout(() => setVisible(true), PLAYING_CTA_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [tablet, footerEnabled, gameActive]);

  if (!tablet || footerEnabled) return null;

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
