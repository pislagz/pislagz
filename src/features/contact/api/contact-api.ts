import { AppError, ERROR_CODES } from "@shared/errors";

export type ContactPayload = {
  name: string;
  contact: string;
  message: string;
};

export type ContactSendResult = "sent" | "already_sent";

const sendMessage = async (payload: ContactPayload): Promise<ContactSendResult> => {
  if (!payload.name.trim() || !payload.contact.trim() || !payload.message.trim()) {
    throw new AppError("Please fill in every field.", ERROR_CODES.VALIDATION);
  }

  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
  };

  if (response.status === 429 || data.error === "already_sent") {
    return "already_sent";
  }

  if (!response.ok) {
    throw new AppError(
      "Couldn't send your message. Please try again.",
      ERROR_CODES.NETWORK,
    );
  }

  return "sent";
};

export const contactApi = {
  sendMessage,
};
