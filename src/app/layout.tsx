import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { TamaguiProvider } from "@/providers/tamagui-provider";

import "./globals.css";
import "../../public/tamagui.generated.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zelify Core",
  description: "Plataforma SaaS de core banking construida con Next.js y Tamagui.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <TamaguiProvider>{children}</TamaguiProvider>
      </body>
    </html>
  );
}
