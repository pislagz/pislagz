import { arsenalApi } from "../api";
import { ArsenalBentoGrid } from "../components/ArsenalBentoGrid";
import styles from "./ArsenalPage.module.css";

export async function ArsenalPage() {
  const items = await arsenalApi.getArsenal();

  return (
    <section className={styles.page} aria-label="my arsenal">
      <ArsenalBentoGrid items={items} />
    </section>
  );
}
