"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useContactForm } from "../hooks/use-contact-form";
import styles from "./ContactForm.module.css";

const FOOTER_GAP = 28;

export function ContactForm() {
  const form = useContactForm();
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const fitMessage = useCallback(() => {
    const field = messageRef.current;
    if (!field) return;

    const box = field.closest("form");
    const footer = document.querySelector("footer");
    const submit = box?.querySelector("button[type='submit']");
    const fieldBox = field.getBoundingClientRect();
    const reserved = box
      ? box.getBoundingClientRect().bottom - fieldBox.bottom
      : (submit?.getBoundingClientRect().height ?? 28) + 24;
    const footerTop = footer?.getBoundingClientRect().top ?? window.innerHeight;
    const maxHeight = Math.max(fieldBox.height, footerTop - fieldBox.top - reserved - FOOTER_GAP);

    field.style.height = "0px";
    field.style.height = `${Math.min(field.scrollHeight, maxHeight)}px`;
  }, []);

  useLayoutEffect(() => {
    fitMessage();
  }, [form.message, fitMessage]);

  useEffect(() => {
    window.addEventListener("resize", fitMessage);
    return () => window.removeEventListener("resize", fitMessage);
  }, [fitMessage]);

  return (
    <form className={styles.form} onSubmit={form.onSubmit}>
      <div className={styles.row}>
        <label className={`${styles.field} ${styles.name}`}>
          <span className={styles.label}>Full name / Company</span>
          <input
            className={styles.input}
            value={form.name}
            onChange={(event) => form.setName(event.target.value)}
            autoComplete="name"
          />
        </label>
        <label className={`${styles.field} ${styles.contact}`}>
          <span className={styles.label}>E-mail / Phone</span>
          <input
            className={styles.input}
            value={form.contact}
            onChange={(event) => form.setContact(event.target.value)}
            autoComplete="email"
          />
        </label>
      </div>
      <label className={`${styles.field} ${styles.full}`}>
        <span className={styles.label}>Message</span>
        <textarea
          ref={messageRef}
          className={`${styles.input} ${styles.message}`}
          rows={2}
          value={form.message}
          onChange={(event) => form.setMessage(event.target.value)}
        />
      </label>
      <button
        type="submit"
        className={styles.submit}
        disabled={form.status === "sending"}
      >
        Send message
        <img src="/assets/icons/send.svg" alt="" width={12} height={12} />
      </button>
      {form.status === "sent" ? <p className={styles.success}>Message sent. Thank you.</p> : null}
    </form>
  );
}
