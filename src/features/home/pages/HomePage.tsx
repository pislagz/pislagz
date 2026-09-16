import { AsciiPortrait } from "../components/AsciiPortrait";
import { HeroHeadline } from "../components/HeroHeadline";
import { SeeArsenalButton } from "../components/SeeArsenalButton";
import styles from "./HomePage.module.css";

export function HomePage() {
  return (
    <section className={styles.hero}>
      <AsciiPortrait />
      <div className={styles.copy}>
        <HeroHeadline />
        <p className={styles.role}>Software Engineer</p>
        <SeeArsenalButton />
      </div>
    </section>
  );
}
