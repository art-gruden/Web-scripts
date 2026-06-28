import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();
const KEY = "lassen:leaderboard";

// GET /api/scores — топ-20 результатів
export async function GET() {
  try {
    // ZRANGE з rev:true = від найвищого балу до найнижчого
    const raw = await redis.zrange(KEY, 0, 19, {
      rev: true,
      withScores: true,
    });

    // Upstash повертає масив об'єктів [{ member, score }, ...]
    // або плоский масив залежно від SDK версії — обробляємо обидва варіанти
    const leaderboard: { name: string; score: number; rank: number }[] = [];

    if (raw.length > 0 && typeof raw[0] === "object" && raw[0] !== null && "member" in (raw[0] as object)) {
      // Об'єктний формат: [{ member: "Alice", score: 12 }, ...]
      (raw as { member: string; score: number }[]).forEach((item, i) => {
        leaderboard.push({ name: item.member, score: item.score, rank: i + 1 });
      });
    } else {
      // Плоский формат: ["Alice", 12, "Bob", 10, ...]
      for (let i = 0; i < raw.length; i += 2) {
        leaderboard.push({
          name: String(raw[i]),
          score: Number(raw[i + 1]),
          rank: Math.floor(i / 2) + 1,
        });
      }
    }

    return NextResponse.json(leaderboard);
  } catch (err) {
    console.error("GET /api/scores error:", err);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}

// POST /api/scores — зберегти результат
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, score, mode } = body as { name: string; score: number; mode: string };

    if (!name || typeof score !== "number" || score < 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const cleanName = name.trim().slice(0, 30); // max 30 символів
    if (!cleanName) {
      return NextResponse.json({ error: "Name is empty" }, { status: 400 });
    }

    // Зберігаємо ім'я + режим як ключ, щоб одна людина мала запис у кожному режимі
    const member = `${cleanName}__${mode || "quiz"}`;

    // ZADD з GT — оновлює тільки якщо новий score більший
    await redis.zadd(KEY, { score, member, gt: true } as Parameters<typeof redis.zadd>[1]);

    // Дізнаємось поточний ранг
    const rank = await redis.zrevrank(KEY, member);

    return NextResponse.json({ ok: true, rank: rank !== null ? rank + 1 : null });
  } catch (err) {
    console.error("POST /api/scores error:", err);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}
