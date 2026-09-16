"use client";

import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
import { Footer } from "./Footer";
import { FooterCopyright } from "./FooterCopyright";
import styles from "./Footer.module.css";

export function FooterSlot() {
  const { footerEnabled } = useDeveloperSettings();

  if (!footerEnabled) {
    return (
      <>
        <FooterCopyright variant="floating" />
        <div className={styles.footerPlaceholder} data-footer-boundary="" aria-hidden="true">
          <div className={styles.footerPlaceholderInner} />
        </div>
      </>
    );
  }

  return <Footer />;
}
