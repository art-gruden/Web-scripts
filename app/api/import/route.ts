import { NextRequest, NextResponse } from "next/server";
import { redis, KEYS } from "@/lib/redis";
import { Word, ImportResult } from "@/lib/types";
import { randomUUID } from "crypto";

// POST /api/import
// Body: { text: string }
// Format per line: немецкое слово/перевод/синонимы/объяснение/тема
export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }

  const lines = text
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l && !l.startsWith("#"));

  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  const now = Date.now();
  const pipeline = redis.pipeline();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split("/").map((p: string) => p.trim());

    if (parts.length < 2) {
      result.errors.push(`Строка ${i + 1}: недостаточно полей — "${line}"`);
      result.skipped++;
      continue;
    }

    const [de, ru, synonyms = "", explanation = "", topic = ""] = parts;

    if (!de || !ru) {
      result.errors.push(`Строка ${i + 1}: пустое слово или перевод — "${line}"`);
      result.skipped++;
      continue;
    }

    const id = randomUUID();
    const ts = now + i; // ensure unique scores

    const word: Word = {
      id,
      de: de.trim(),
      ru: ru.trim(),
      synonyms: synonyms.trim(),
      explanation: explanation.trim(),
      topic: topic.trim(),
      createdAt: ts,
    };

    pipeline.hset(KEYS.word(id), word as unknown as Record<string, unknown>);
    pipeline.zadd(KEYS.wordsList, { score: ts, member: id });
    result.imported++;
  }

  await pipeline.exec();

  return NextResponse.json(result);
}
