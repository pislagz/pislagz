import { request } from "@shared/api";
import { AppError, ERROR_CODES } from "@shared/errors";

export type ContactPayload = {
  name: string;
  contact: string;
  message: string;
};

const sendMessage = async (payload: ContactPayload) => {
  if (!payload.name.trim() || !payload.contact.trim() || !payload.message.trim()) {
    throw new AppError("Please fill in every field.", ERROR_CODES.VALIDATION);
  }

  return request<{ ok: boolean }>("/api/contact", {
    method: "POST",
    body: payload,
  });
};

export const contactApi = {
  sendMessage,
};
