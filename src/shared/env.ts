export function isPreviewEnv(): boolean {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_APP_ENV === "preview"
  );
}
