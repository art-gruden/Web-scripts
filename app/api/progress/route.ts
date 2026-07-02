import { NextRequest, NextResponse } from "next/server";
import { redis, KEYS } from "@/lib/redis";

// POST /api/progress
// Body: { userId, wordId, action: "know" | "unsee" | "seen" }
export async function POST(req: NextRequest) {
  const { userId = "default", wordId, action } = await req.json();

  if (!wordId || !action) {
    return NextResponse.json({ error: "wordId and action required" }, { status: 400 });
  }

  const pipeline = redis.pipeline();

  if (action === "know") {
    pipeline.sadd(KEYS.userKnown(userId), wordId);
    pipeline.hincrby(KEYS.userProgress(userId), wordId, 1);
  } else if (action === "unsee") {
    pipeline.srem(KEYS.userKnown(userId), wordId);
  } else if (action === "seen") {
    pipeline.hincrby(KEYS.userProgress(userId), wordId, 1);
  }

  await pipeline.exec();
  return NextResponse.json({ ok: true });
}

// GET /api/progress?userId=...
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId") || "default";

  const [known, progress] = await Promise.all([
    redis.smembers(KEYS.userKnown(userId)),
    redis.hgetall(KEYS.userProgress(userId)),
  ]);

  return NextResponse.json({
    known: (known as string[]) || [],
    progress: (progress as Record<string, string>) || {},
  });
}
