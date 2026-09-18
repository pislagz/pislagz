import { GlassArrowCta } from "@shared/ui/GlassArrowCta";
import styles from "../pages/HomePage.module.css";

export function SeeArsenalButton() {
  return (
    <GlassArrowCta href="/arsenal" className={styles.cta}>
      see my arsenal
    </GlassArrowCta>
  );
}
