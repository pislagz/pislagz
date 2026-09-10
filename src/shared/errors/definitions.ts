export const ERROR_CODES = {
  UNKNOWN: "UNKNOWN",
  NETWORK: "NETWORK",
  VALIDATION: "VALIDATION",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  code: ErrorCode;

  constructor(message: string, code: ErrorCode = ERROR_CODES.UNKNOWN) {
    super(message);
    this.code = code;
    this.name = "AppError";
  }
}
