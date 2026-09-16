export const DEFAULT_CONTACT_OR_OFFSET = 0;
export const CONTACT_OR_OFFSET_MIN = -30;
export const CONTACT_OR_OFFSET_MAX = 80;

export function formatContactOrOffset(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded >= 0 ? "+" : "";
  return `(${sign}${rounded}px)`;
}

export function isContactOrOffsetChanged(value: number): boolean {
  return Math.round(value) !== 0;
}

export function applyContactLayoutVars(offsetY: number) {
  document.documentElement.style.setProperty("--dev-contact-or-offset-y", `${offsetY}px`);
}

export function clearContactLayoutVars() {
  document.documentElement.style.removeProperty("--dev-contact-or-offset-y");
}
