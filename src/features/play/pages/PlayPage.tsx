import { PlayGame } from "../components/PlayGame";
import styles from "./PlayPage.module.css";

export function PlayPage() {
  return (
    <section className={styles.page}>
      <PlayGame />
    </section>
  );
}
