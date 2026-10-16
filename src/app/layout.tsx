import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const font = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Event Lead Manager",
  description: "Capture and follow up with people you meet at business events.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${font.variable} font-sans`}>{children}</body>
    </html>
  );
}
