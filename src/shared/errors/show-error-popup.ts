import { AppError, ERROR_CODES } from "./definitions";

export const showErrorPopup = (error: unknown) => {
  const message =
    error instanceof AppError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.";

  if (typeof window !== "undefined") {
    window.alert(message);
  }

  return { code: error instanceof AppError ? error.code : ERROR_CODES.UNKNOWN, message };
};
