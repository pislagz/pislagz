import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { App } from "@shared/App";
import { SITE_TITLE } from "@shared/constants";
import "@shared/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: "Frontend developer demo page – Pawel Pisulski.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <App>{children}</App>
      </body>
    </html>
  );
}
