import { contactDay, CONTACT_SENT_COOKIE } from "./contact-day";

const sentByIp = new Map<string, string>();

export const clientIp = (headers: Headers) => {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
};

export const hasSentToday = (headers: Headers) => {
  const today = contactDay();
  const cookieDay = headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CONTACT_SENT_COOKIE}=`))
    ?.slice(CONTACT_SENT_COOKIE.length + 1);
  if (cookieDay === today) return true;

  const ip = clientIp(headers);
  if (ip !== "unknown" && sentByIp.get(ip) === today) return true;
  return false;
};

export const rememberSuccessfulSend = (headers: Headers) => {
  const today = contactDay();
  const ip = clientIp(headers);
  if (ip !== "unknown") sentByIp.set(ip, today);

  for (const [key, day] of sentByIp) {
    if (day !== today) sentByIp.delete(key);
  }

  return `${CONTACT_SENT_COOKIE}=${today}; Path=/; Max-Age=172800; SameSite=Lax; HttpOnly`;
};
