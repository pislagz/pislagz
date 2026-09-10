"use client";

import { useState, type FormEvent } from "react";
import { showErrorPopup } from "@shared/errors";
import { contactApi } from "../api";

type Status = "idle" | "sending" | "sent";

export const useContactForm = () => {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    try {
      await contactApi.sendMessage({ name, contact, message });
      setName("");
      setContact("");
      setMessage("");
      setStatus("sent");
    } catch (error) {
      showErrorPopup(error);
      setStatus("idle");
    }
  };

  return {
    name,
    contact,
    message,
    status,
    setName,
    setContact,
    setMessage,
    onSubmit,
  };
};
