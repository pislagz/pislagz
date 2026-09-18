import localFont from "next/font/local";

export const quantico = localFont({
  src: [
    {
      path: "../../assets/fonts/Quantico-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Quantico-Regular.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Quantico-Regular.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-quantico",
  display: "swap",
});

export const aeonik = localFont({
  src: [
    {
      path: "../../assets/fonts/Aeonik-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Aeonik-Regular.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../assets/fonts/Aeonik-Bold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-aeonik",
  display: "swap",
});
