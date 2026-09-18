"use client";

import { useEffect, useState } from "react";
import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import { schedulePlayFooterActionDelay } from "@shared/play-footer-action";
import { GlassArrowCta } from "@shared/ui/GlassArrowCta";
import styles from "./ArsenalContinueCta.module.css";

const COMPACT_NAV_QUERY = "(max-width: 1100px)";

export function ArsenalContinueCta() {
  const { footerEnabled } = useDeveloperSettings();
  const compactNav = useMediaQuery(COMPACT_NAV_QUERY);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (footerEnabled || !compactNav) {
      setVisible(false);
      return;
    }

    const reveal = () => setVisible(true);
    if (
      document.documentElement.dataset.arsenalSettled === "true" ||
      document.documentElement.dataset.arsenalContinueReady === "true"
    ) {
      setVisible(true);
      return;
    }

    window.addEventListener("arsenal-grid-settled", reveal);
    window.addEventListener("arsenal-continue-ready", reveal);
    return () => {
      window.removeEventListener("arsenal-grid-settled", reveal);
      window.removeEventListener("arsenal-continue-ready", reveal);
    };
  }, [footerEnabled, compactNav]);

  if (footerEnabled || !visible) return null;

  return (
    <div className={styles.wrap}>
      <GlassArrowCta
        href="/play"
        className={styles.cta}
        onClick={schedulePlayFooterActionDelay}
      >
        continue
      </GlassArrowCta>
    </div>
  );
}
