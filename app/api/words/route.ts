import { NextRequest, NextResponse } from "next/server";
import { redis, KEYS } from "@/lib/redis";
import { Word } from "@/lib/types";
import { randomUUID } from "crypto";

// GET /api/words?topic=...&userId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topic = searchParams.get("topic") || "";
  const userId = searchParams.get("userId") || "default";

  // Get all word IDs sorted by creation time (newest first)
  const wordIds = await redis.zrange(KEYS.wordsList, 0, -1, { rev: true }) as string[];

  if (!wordIds.length) return NextResponse.json({ words: [], topics: [] });

  // Fetch all words
  const pipeline = redis.pipeline();
  wordIds.forEach((id) => pipeline.hgetall(KEYS.word(id)));
  const results = await pipeline.exec();

  let words = results
    .map((r, i) => ({ ...(r as object), id: wordIds[i] } as Word))
    .filter((w) => w.de); // filter nulls

  // Filter by topic
  if (topic) words = words.filter((w) => w.topic === topic);

  // Attach user progress
  const knownSet = new Set(
    ((await redis.smembers(KEYS.userKnown(userId))) as string[]) || []
  );
  const progressHash = ((await redis.hgetall(KEYS.userProgress(userId))) || {}) as Record<string, string>;

  const withProgress = words.map((w) => ({
    ...w,
    known: knownSet.has(w.id),
    seenCount: parseInt(progressHash[w.id] || "0"),
  }));

  // Get unique topics
  const topics = Array.from(new Set(
    results
      .map((r) => (r as Word)?.topic)
      .filter(Boolean)
  )).sort();

  return NextResponse.json({ words: withProgress, topics });
}

// POST /api/words - add single word
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { de, ru, synonyms, explanation, topic } = body;

  if (!de || !ru) {
    return NextResponse.json({ error: "de and ru are required" }, { status: 400 });
  }

  const id = randomUUID();
  const now = Date.now();

  const word: Word = {
    id,
    de: de.trim(),
    ru: ru.trim(),
    synonyms: (synonyms || "").trim(),
    explanation: (explanation || "").trim(),
    topic: (topic || "").trim(),
    createdAt: now,
  };

  await redis.pipeline()
    .hset(KEYS.word(id), word as unknown as Record<string, unknown>)
    .zadd(KEYS.wordsList, { score: now, member: id })
    .exec();

  return NextResponse.json({ word });
}

// DELETE /api/words?id=...
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await redis.pipeline()
    .del(KEYS.word(id))
    .zrem(KEYS.wordsList, id)
    .exec();

  return NextResponse.json({ ok: true });
}
