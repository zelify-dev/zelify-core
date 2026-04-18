import type { Metadata } from "next";
import { Nata_Sans } from "next/font/google";

import { TamaguiProvider } from "@/providers/tamagui-provider";

import "./globals.css";
import "../../public/tamagui.generated.css";

const nataSans = Nata_Sans({
  variable: "--font-nata-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
    <html lang="es" className={nataSans.variable}>
      <body>
        <TamaguiProvider>{children}</TamaguiProvider>
      </body>
    </html>
  );
}
