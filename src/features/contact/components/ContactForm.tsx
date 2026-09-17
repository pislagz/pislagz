"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDeveloperSettings } from "@shared/developer/DeveloperSettings";
import { useContactForm } from "../hooks/use-contact-form";
import styles from "./ContactForm.module.css";

const BUTTON_OUT_MS = 520;
const MESSAGE_MAX_PX = 240;
const FORM_BOTTOM_GAP_PX = 8;

export function ContactForm() {
  const form = useContactForm();
  const { footerEnabled } = useDeveloperSettings();
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

    field.style.minHeight = "";
    field.style.height = "0px";
    const contentHeight = field.scrollHeight;
    const formEl = field.closest("form");
    const main = field.closest("main");
    const boundary = document.querySelector("[data-footer-boundary]");

    let next = Math.min(contentHeight, MESSAGE_MAX_PX);
    const desktop = window.matchMedia("(min-width: 901px)").matches;

    if (desktop && formEl && main) {
      const fieldBox = field.getBoundingClientRect();
      const formBox = formEl.getBoundingClientRect();
      const belowField = formBox.bottom - fieldBox.bottom;
      const limit = boundary
        ? boundary.getBoundingClientRect().top
        : main.getBoundingClientRect().bottom;
      const available = Math.floor(limit - FORM_BOTTOM_GAP_PX - fieldBox.top - belowField);
      if (Number.isFinite(available)) {
        next = Math.min(next, Math.max(0, available));
      }
    }

    field.style.minHeight = `${next}px`;
    field.style.height = `${next}px`;
    field.style.overflowY = contentHeight > next + 1 ? "auto" : "hidden";
  }, []);

  useLayoutEffect(() => {
    fitMessage();
    window.addEventListener("resize", fitMessage);
    return () => window.removeEventListener("resize", fitMessage);
  }, [form.message, form.status, buttonGone, footerEnabled, fitMessage]);

  return (
    <form
      className={`${styles.form} ${form.status === "sent" ? styles.formSent : ""}`}
      data-status={form.status}
      onSubmit={form.onSubmit}
    >
      <div className={styles.sweep} aria-hidden="true" />
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
      <div className={styles.actionRow}>
        {form.error ? <p className={styles.error}>{form.error}</p> : null}
        {buttonGone ? (
          <p className={`${styles.success} ${styles.successIn}`}>Message sent. Thank you.</p>
        ) : null}
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
      </div>
    </form>
  );
}
