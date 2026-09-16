"use client";

import { useEffect, useState } from "react";
import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import { schedulePlayFooterActionDelay } from "@shared/play-footer-action";
import { Button } from "@shared/ui/Button";
import styles from "./ArsenalContinueCta.module.css";

export function ArsenalContinueCta() {
  const { footerEnabled } = useDeveloperSettings();
  const mobile = useMediaQuery("(max-width: 900px)");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (footerEnabled || !mobile) {
      setVisible(false);
      return;
    }

    const reveal = () => setVisible(true);
    if (document.documentElement.dataset.arsenalSettled === "true") {
      setVisible(true);
      return;
    }

    window.addEventListener("arsenal-grid-settled", reveal);
    return () => window.removeEventListener("arsenal-grid-settled", reveal);
  }, [footerEnabled, mobile]);

  if (footerEnabled || !visible) return null;

  return (
    <div className={styles.wrap}>
      <Button
        href="/play"
        variant="glass"
        iconSrc="/assets/icons/arrow-circle.svg"
        iconSize={24}
        className={styles.cta}
        onClick={schedulePlayFooterActionDelay}
      >
        continue
      </Button>
    </div>
  );
}
