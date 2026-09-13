import { Button } from "@shared/ui/Button";
import { AsciiPortrait } from "../components/AsciiPortrait";
import { HeroHeadline } from "../components/HeroHeadline";
import styles from "./HomePage.module.css";

export function HomePage() {
  return (
    <section className={styles.hero}>
      <AsciiPortrait />
      <div className={styles.copy}>
        <HeroHeadline />
        <p className={styles.role}>Frontend Engineer</p>
        <Button
          href="/arsenal"
          variant="glass"
          iconSrc="/assets/icons/arrow-circle.svg"
          iconSize={24}
          className={styles.cta}
        >
          see my arsenal
        </Button>
      </div>
    </section>
  );
}
