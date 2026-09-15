import { Button } from "@shared/ui/Button";
import styles from "../pages/HomePage.module.css";

export function SeeArsenalButton() {
  return (
    <Button
      href="/arsenal"
      variant="glass"
      iconSrc="/assets/icons/arrow-circle.svg"
      iconSize={24}
      className={styles.cta}
    >
      see my arsenal
    </Button>
  );
}
