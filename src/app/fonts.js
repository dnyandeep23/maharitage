import { Cinzel, Cormorant_Garamond, Inter, Manrope } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
});

export const playfairDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const cinzelDecorative = Cinzel({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-brand",
  weight: ["500", "600", "700", "800", "900"],
});

export const lexend = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
});
