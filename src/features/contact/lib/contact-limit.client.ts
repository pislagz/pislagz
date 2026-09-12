import { contactDay, CONTACT_SENT_STORAGE } from "./contact-day";

export const hasStoredSendToday = () => {
  if (typeof window === "undefined") return false;
  const today = contactDay();
  try {
    return (
      sessionStorage.getItem(CONTACT_SENT_STORAGE) === today ||
      localStorage.getItem(CONTACT_SENT_STORAGE) === today
    );
  } catch {
    return false;
  }
};

export const storeSuccessfulSend = () => {
  const today = contactDay();
  try {
    sessionStorage.setItem(CONTACT_SENT_STORAGE, today);
    localStorage.setItem(CONTACT_SENT_STORAGE, today);
  } catch {
    /* private mode */
  }
};
