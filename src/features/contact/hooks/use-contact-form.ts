"use client";

import { useLayoutEffect, useState, type FormEvent } from "react";
import { AppError } from "@shared/errors";
import { contactApi } from "../api";
import {
  hasStoredSendToday,
  storeSuccessfulSend,
} from "../lib/contact-limit.client";

type Status = "idle" | "sending" | "sent";

export const useContactForm = () => {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [lockedOnLoad, setLockedOnLoad] = useState(false);

  useLayoutEffect(() => {
    if (!hasStoredSendToday()) return;
    setLockedOnLoad(true);
    setStatus("sent");
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending" || status === "sent") return;

    if (!name.trim() || !contact.trim() || !message.trim()) {
      setError("Please fill in every field.");
      return;
    }

    setError("");
    setStatus("sending");
    try {
      const result = await contactApi.sendMessage({ name, contact, message });
      storeSuccessfulSend();
      if (result === "sent") {
        setName("");
        setContact("");
        setMessage("");
      }
      setStatus("sent");
    } catch (caught) {
      setError(
        caught instanceof AppError
          ? caught.message
          : "Couldn't send your message. Please try again.",
      );
      setStatus("idle");
    }
  };

  return {
    name,
    contact,
    message,
    status,
    error,
    lockedOnLoad,
    setName,
    setContact,
    setMessage,
    onSubmit,
  };
};
