import type { Metadata } from "next";
import { Alegreya, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

const alegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});
const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "PianoHero",
  description: "Aprenda a ler partituras tocando piano.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${alegreya.variable} ${atkinson.variable}`}>{children}</body>
    </html>
  );
}
