"use client";

import { useEffect, useState } from "react";
import { playArcadeSound } from "@shared/arcade-audio";
import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import { Button } from "@shared/ui/Button";
import { GlassReveal } from "@shared/ui/GlassReveal";
import styles from "./PlayTabletCtas.module.css";

const HAMBURGER_QUERY = "(max-width: 1100px)";
const PLAYING_CTA_DELAY_MS = 3500;

type Props = {
  gameActive: boolean;
  gameOver: boolean;
  pong: boolean;
};

export function PlayTabletCtas({ gameActive, gameOver, pong }: Props) {
  const { footerEnabled } = useDeveloperSettings();
  const hamburger = useMediaQuery(HAMBURGER_QUERY);
  const [visible, setVisible] = useState(false);
  const pongResume = pong && !footerEnabled;
  const invadersCtas = !pong && hamburger && !footerEnabled;

  useEffect(() => {
    if (pongResume || !invadersCtas || !gameActive) {
      setVisible(false);
      return;
    }

    const timeout = window.setTimeout(() => setVisible(true), PLAYING_CTA_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [pongResume, invadersCtas, gameActive]);

  if (pongResume) {
    return (
      <div className={styles.pongResumeSlot}>
        <GlassReveal show={gameOver} data-play-resume-cta="">
          <Button
            href="/resume"
            variant="glass"
            className={styles.pongCta}
            onClick={() => playArcadeSound("select")}
          >
            see résumé
          </Button>
        </GlassReveal>
      </div>
    );
  }

  if (!invadersCtas) return null;

  return (
    <div className={styles.wrap} aria-hidden={!visible}>
      <GlassReveal show={visible}>
        <Button
          href="/resume"
          variant="glass"
          className={styles.link}
          onClick={() => playArcadeSound("select")}
        >
          see résumé
        </Button>
      </GlassReveal>
      <GlassReveal show={visible} delayMs={80}>
        <Button
          href="/hire-me"
          variant="glass"
          className={styles.link}
          onClick={() => playArcadeSound("select")}
        >
          contact me
        </Button>
      </GlassReveal>
    </div>
  );
}
