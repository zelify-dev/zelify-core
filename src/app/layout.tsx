import type { Metadata } from "next";
import localFont from "next/font/local";

import { TamaguiProvider } from "@/providers/tamagui-provider";

import "./globals.css";
import "../../public/tamagui.generated.css";

const nataSans = localFont({
  variable: "--font-nata-sans",
  src: [
    {
      path: "../../public/fonts/Nata_Sans/NataSans-VariableFont_wght.ttf",
      style: "normal",
      weight: "100 900",
    },
  ],
});

export const metadata: Metadata = {
  title: "Zelify Core",
  description: "Plataforma SaaS de core banking construida con Next.js y Tamagui.",
  icons: {
    icon: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={nataSans.variable}>
      <body>
        <TamaguiProvider>{children}</TamaguiProvider>
      </body>
    </html>
  );
}
