import { arsenalApi } from "../api";
import { RouteEntranceSound } from "@shared/components/RouteEntranceSound";
import { ArsenalBentoGrid } from "../components/ArsenalBentoGrid";
import { ArsenalScrollNudge } from "../components/ArsenalScrollNudge";
import styles from "./ArsenalPage.module.css";

export async function ArsenalPage() {
  const items = await arsenalApi.getArsenal();

  return (
    <section className={styles.page} aria-label="my arsenal">
      <RouteEntranceSound route="arsenal" />
      <ArsenalBentoGrid items={items} />
      <ArsenalScrollNudge />
    </section>
  );
}
