import { CONTACT_EMAIL } from "@shared/constants";
import { ContactForm } from "../components/ContactForm";
import styles from "./ContactPage.module.css";

export function ContactPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>contact</h1>
      <p className={styles.lead}>
        If you want to hire me or do some projects together do not hesitate to contact with me.
      </p>
      <div className={styles.direct}>
        <p className={styles.via}>via e-mail</p>
        <a className={styles.email} href={`mailto:${CONTACT_EMAIL}`}>
          <img src="/assets/icons/mail.svg" alt="" width={20} height={20} />
          {CONTACT_EMAIL}
        </a>
      </div>
      <p className={styles.or}>
        or directly using this form
        <img src="/assets/icons/form-arrow.svg" alt="" width={24} height={24} />
      </p>
      <ContactForm />
    </section>
  );
}
