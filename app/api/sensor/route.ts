import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = Redis.fromEnv();
const KEY = "sensor:temperatures";
const MAX_RECORDS = 500;

export async function POST(req: NextRequest) {
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

  await redis.lpush(KEY, JSON.stringify(record));
  await redis.ltrim(KEY, 0, MAX_RECORDS - 1);

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);

  const raw = await redis.lrange(KEY, 0, limit - 1);
  const records = raw.map(r => JSON.parse(r as string));

  return NextResponse.json(records.reverse());
}
