import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";

import { HashScroll } from "@/components/hash-scroll";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ølberg strandhager – der hagen møter havet",
  description:
    "Kurs, konferanser og samlinger i Felleshuset, 47 parsellhager ved Solastranden i Sola – kort vei fra Stavanger lufthavn.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nb" className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <HashScroll />
        {children}
      </body>
    </html>
  );
}
