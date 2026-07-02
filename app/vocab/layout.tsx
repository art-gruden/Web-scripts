import type { Metadata } from "next";
import "./vocab.css";

export const metadata: Metadata = {
  title: "Deutsch Vokabeln",
  description: "B1+ / B2 Vocabulary Trainer with Upstash Redis",
};

export default function VocabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
