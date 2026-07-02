export interface Word {
  id: string;
  de: string;           // немецкое слово
  ru: string;            // перевод на русский
  synonyms: string;     // синонимы на немецком
  explanation: string;  // объяснение на немецком
  topic: string;        // Номер и тема по книге (напр. "Kapitel 1 – Schule")
  createdAt: number;    // timestamp
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface WordWithProgress extends Word {
  known: boolean;
  seenCount: number;
}
