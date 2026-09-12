import Link from "next/link";
import { CONTACT_EMAIL, SOCIAL } from "@shared/constants";
import { ContactForm } from "../components/ContactForm";
import styles from "./ContactPage.module.css";

export function ContactPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>contact</h1>
      <p className={styles.lead}>
        Want to hire me or work on a project together?
        <br />
        Reach me here:
      </p>
      <ul className={styles.direct}>
        <li>
          <a className={styles.contactLink} href={`mailto:${CONTACT_EMAIL}`}>
            <img src="/assets/icons/mail.svg" alt="" width={20} height={20} />
            <span className={styles.channel}>
              <span className={styles.via}>Email</span>
              <span className={styles.value}>{CONTACT_EMAIL}</span>
            </span>
          </a>
        </li>
        <li>
          <a
            className={styles.contactLink}
            href={SOCIAL.linkedin}
            target="_blank"
            rel="noreferrer"
          >
            <img src="/assets/icons/linkedin.svg" alt="" width={18} height={18} />
            <span className={styles.channel}>
              <span className={styles.via}>LinkedIn</span>
              <span className={styles.value}>Pawel Pisulski</span>
            </span>
          </a>
        </li>
        <li>
          <Link className={styles.contactLink} href="/resume">
            <img src="/assets/icons/phone.svg" alt="" width={18} height={18} />
            <span className={styles.channel}>
              <span className={styles.via}>Phone</span>
              <span className={styles.value}>
                Available in{" "}
                <span className={styles.resumeHint}>
                  <span className={styles.resumeLabel}>my résumé</span>
                  <img
                    className={styles.resumePdf}
                    src="/assets/icons/pdf.svg"
                    alt=""
                    width={12}
                    height={12}
                  />
                </span>
              </span>
            </span>
          </Link>
        </li>
      </ul>
      <p className={styles.or}>
        or send a message below
        <img src="/assets/icons/form-arrow.svg" alt="" width={24} height={24} />
      </p>
      <ContactForm />
    </section>
  );
}
