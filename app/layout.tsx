import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lassen Trainer B2",
  description: "Тренажер дієслова lassen для рівня B2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
