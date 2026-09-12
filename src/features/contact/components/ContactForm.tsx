"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useContactForm } from "../hooks/use-contact-form";
import styles from "./ContactForm.module.css";

const FOOTER_GAP = 28;
const BUTTON_OUT_MS = 520;

export function ContactForm() {
  const form = useContactForm();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [buttonGone, setButtonGone] = useState(false);
  const locked = form.status === "sent";
  const busy = form.status === "sending";

  useLayoutEffect(() => {
    if (form.lockedOnLoad) setButtonGone(true);
  }, [form.lockedOnLoad]);

  useEffect(() => {
    if (form.status !== "sent" || form.lockedOnLoad) return;
    const timer = window.setTimeout(() => setButtonGone(true), BUTTON_OUT_MS);
    return () => window.clearTimeout(timer);
  }, [form.status, form.lockedOnLoad]);

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
  }, [form.message, form.status, buttonGone, fitMessage]);

  useEffect(() => {
    window.addEventListener("resize", fitMessage);
    return () => window.removeEventListener("resize", fitMessage);
  }, [fitMessage]);

  return (
    <form
      className={`${styles.form} ${form.status === "sent" ? styles.formSent : ""}`}
      data-status={form.status}
      onSubmit={form.onSubmit}
    >
      <div className={styles.row}>
        <label className={`${styles.field} ${styles.name}`}>
          <span className={styles.label}>Full name / Company</span>
          <input
            className={styles.input}
            value={form.name}
            onChange={(event) => form.setName(event.target.value)}
            autoComplete="name"
            disabled={busy || locked}
          />
        </label>
        <label className={`${styles.field} ${styles.contact}`}>
          <span className={styles.label}>E-mail / Phone</span>
          <input
            className={styles.input}
            value={form.contact}
            onChange={(event) => form.setContact(event.target.value)}
            autoComplete="email"
            disabled={busy || locked}
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
          disabled={busy || locked}
        />
      </label>
      <div className={styles.actionRow}>
        {!buttonGone ? (
          <button
            type="submit"
            className={`${styles.submit} ${busy ? styles.submitSending : ""} ${
              form.status === "sent" ? styles.submitOut : ""
            }`}
            disabled={busy || locked}
          >
            <span>{busy ? "Sending" : "Send message"}</span>
            <img src="/assets/icons/send.svg" alt="" width={12} height={12} />
          </button>
        ) : null}
        {form.error ? <p className={styles.error}>{form.error}</p> : null}
        {buttonGone ? (
          <p className={`${styles.success} ${styles.successIn}`}>Message sent. Thank you.</p>
        ) : null}
      </div>
    </form>
  );
}
