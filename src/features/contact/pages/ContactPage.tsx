import Link from "next/link";
import { CONTACT_EMAIL, SOCIAL } from "@shared/constants";
import { ContactForm } from "../components/ContactForm";
import styles from "./ContactPage.module.css";

export function ContactPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>contact</h1>
      <p className={styles.lead}>
        If you want to hire me or do some projects together do not hesitate to contact me:
      </p>
      <div className={styles.direct}>
        <div className={styles.method}>
          <p className={styles.via}>via email</p>
          <a className={styles.contactLink} href={`mailto:${CONTACT_EMAIL}`}>
            <img src="/assets/icons/mail.svg" alt="" width={20} height={20} />
            {CONTACT_EMAIL}
          </a>
        </div>
        <div className={styles.method}>
          <p className={styles.via}>via LinkedIn</p>
          <a
            className={styles.contactLink}
            href={SOCIAL.linkedin}
            target="_blank"
            rel="noreferrer"
          >
            <img src="/assets/icons/linkedin.svg" alt="" width={18} height={18} />
            Pawel Pisulski
          </a>
        </div>
        <div className={styles.method}>
          <p className={styles.via}>via phone</p>
          <Link className={styles.contactLink} href="/resume">
            <img src="/assets/icons/pdf.svg" alt="" width={18} height={18} />
            phone number available in my résumé
          </Link>
        </div>
      </div>
      <p className={styles.or}>
        or directly using this form
        <img src="/assets/icons/form-arrow.svg" alt="" width={24} height={24} />
      </p>
      <ContactForm />
    </section>
  );
}
