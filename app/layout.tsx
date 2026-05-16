import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/layout/AppHeader";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Живое Городище",
  description: "Интерактивная карта коллективного строительства исторического поселения.",
  openGraph: {
    title: "Живое Городище",
    description: "Выберите объект на карте, поддержите строительство и попадите в летопись.",
    images: ["/assets/settlement-map.png"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
