import type { Metadata, Viewport } from "next";
import { App } from "@shared/App";
import { SITE_TITLE } from "@shared/constants";
import { aeonik, quantico } from "@shared/styles/fonts";
import "@shared/styles/globals.css";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: "Software Engineer demo page – Pawel Pisulski.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${aeonik.variable} ${quantico.variable}`}>
      <body>
        <App>{children}</App>
      </body>
    </html>
  );
}
