const WARSAW = "Europe/Warsaw";

export const contactDay = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: WARSAW,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export const CONTACT_SENT_COOKIE = "contact_sent_on";
export const CONTACT_SENT_STORAGE = "contact:sent-on";
