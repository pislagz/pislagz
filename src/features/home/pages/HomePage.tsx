import { SOCIAL } from "@shared/constants";
import { Button } from "@shared/ui/Button";
import { HeroHeadline } from "../components/HeroHeadline";
import styles from "./HomePage.module.css";

export function HomePage() {
  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <HeroHeadline />
        <p className={styles.role}>Frontend Developer</p>
        <Button
          href={SOCIAL.github}
          variant="glass"
          iconSrc="/assets/icons/arrow-circle.svg"
          iconSize={24}
          className={styles.cta}
        >
          check my projects
        </Button>
      </div>
    </section>
  );
}
