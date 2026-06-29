import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();
const KEY = "sensor:temperatures";
const MAX_RECORDS = 500;

// Upstash SDK іноді вже десеріалізує JSON автоматично —
// ця функція безпечно обробляє обидва випадки
function parseRecord(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  // Upstash SDK вже повернув об'єкт — використовуємо напряму
  return raw;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.SENSOR_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { temperature, humidity, device_id } = await req.json();

    if (typeof temperature !== "number") {
      return NextResponse.json({ error: "Invalid temperature" }, { status: 400 });
    }

    const record = {
      t: temperature,
      h: humidity ?? null,
      d: device_id ?? "esp32",
      ts: Date.now(),
    };

    // Зберігаємо як рядок явно
    await redis.lpush(KEY, JSON.stringify(record));
    await redis.ltrim(KEY, 0, MAX_RECORDS - 1);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/sensor error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);

    const raw = await redis.lrange(KEY, 0, limit - 1);

    const records = raw
      .map(parseRecord)
      .filter((r): r is { t: number; h: number | null; d: string; ts: number } =>
        r !== null &&
        typeof r === "object" &&
        "t" in (r as object) &&
        "ts" in (r as object)
      );

    return NextResponse.json(records.reverse());
  } catch (err) {
    console.error("GET /api/sensor error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
