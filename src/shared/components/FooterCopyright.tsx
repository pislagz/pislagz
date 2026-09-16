import styles from "./Footer.module.css";

type Props = {
  variant?: "inline" | "floating";
};

export function FooterCopyright({ variant = "inline" }: Props) {
  const currentYear = new Date().getFullYear();

  if (variant === "floating") {
    return (
      <div className={styles.floatingCopyBar} aria-hidden="true">
        <div className={styles.floatingCopyInner}>
          <p className={styles.floatingCopy}>
            All rights reserved | Pawel Pisulski | {currentYear}
          </p>
        </div>
      </div>
    );
  }

  return (
    <p className={styles.copy}>
      All rights reserved | Pawel Pisulski | {currentYear}
    </p>
  );
}
