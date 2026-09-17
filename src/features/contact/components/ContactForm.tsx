"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useContactForm } from "../hooks/use-contact-form";
import { useMediaQuery } from "@shared/hooks/use-media-query";
import styles from "./ContactForm.module.css";

const BUTTON_OUT_MS = 520;
const MOBILE_ACTION_ROOT_MARGIN = "0px 0px -64px 0px";

export function ContactForm() {
  const form = useContactForm();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const actionSentinelRef = useRef<HTMLDivElement>(null);
  const mobile = useMediaQuery("(max-width: 900px)");
  const [buttonGone, setButtonGone] = useState(false);
  const [actionRevealed, setActionRevealed] = useState(false);
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

    field.style.height = "0px";
    field.style.height = `${field.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    fitMessage();
  }, [form.message, form.status, buttonGone, fitMessage]);

  useEffect(() => {
    if (!mobile) {
      setActionRevealed(true);
      return;
    }

    const sentinel = actionSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setActionRevealed(entry.isIntersecting),
      { threshold: 0, rootMargin: MOBILE_ACTION_ROOT_MARGIN },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [mobile, form.message, form.status, buttonGone]);

  return (
    <form
      className={`${styles.form} ${form.status === "sent" ? styles.formSent : ""}`}
      data-status={form.status}
      onSubmit={form.onSubmit}
    >
      <div className={styles.row}>
        <label
          className={`${styles.fieldBox} ${styles.name} ${form.name ? styles.filled : ""}`}
        >
          <span className={styles.label}>Full name / Company</span>
          <input
            className={styles.input}
            value={form.name}
            onChange={(event) => form.setName(event.target.value)}
            autoComplete="name"
            disabled={busy || locked}
          />
        </label>
        <label
          className={`${styles.fieldBox} ${styles.contact} ${form.contact ? styles.filled : ""}`}
        >
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
      <label className={`${styles.fieldBox} ${styles.full} ${form.message ? styles.filled : ""}`}>
        <span className={styles.label}>Message</span>
        <textarea
          ref={messageRef}
          className={`${styles.input} ${styles.message}`}
          rows={1}
          value={form.message}
          onChange={(event) => form.setMessage(event.target.value)}
          disabled={busy || locked}
        />
      </label>
      <div ref={actionSentinelRef} className={styles.actionSentinel} aria-hidden="true" />
      <div
        className={`${styles.actionRow} ${actionRevealed ? styles.actionRowRevealed : ""}`}
      >
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
