import type { Metadata } from "next";
import "./trainer.css";

export const metadata: Metadata = {
  title: "Verb LASSEN – Trainer B2",
  description: "Тренажер для вивчення дієслова lassen (B2)",
};

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
