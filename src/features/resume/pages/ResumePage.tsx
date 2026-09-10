import { RESUME_PDF_PATH } from "@shared/constants";
import { Button } from "@shared/ui/Button";
import styles from "./ResumePage.module.css";

export function ResumePage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>my résumé</h1>
      <p className={styles.lead}>
        If you want to know more about me download my résumé. Feel free to use that data in any
        recruitment process.
      </p>
      <Button
        href={RESUME_PDF_PATH}
        download
        variant="glass"
        iconSrc="/assets/icons/pdf.svg"
        iconSize={18}
        className={styles.cta}
      >
        Download PDF
      </Button>
    </section>
  );
}
