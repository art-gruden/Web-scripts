"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ============================================================
// ТИПИ
// ============================================================
interface SensorRecord {
  t: number;
  h: number | null;
  d: string;
  ts: number;
}

interface Stats {
  min: number;
  max: number;
  avg: number;
  last: number;
  count: number;
}

type Range = "1h" | "6h" | "24h" | "7d" | "all";

// ============================================================
// УТИЛІТИ
// ============================================================
function calcStats(values: number[]): Stats | null {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { min, max, avg, last: values[values.length - 1], count: values.length };
}

function formatTime(ts: number, range: Range): string {
  const d = new Date(ts);
  if (range === "7d") return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  if (range === "24h") return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function filterByRange(data: SensorRecord[], range: Range): SensorRecord[] {
  if (range === "all") return data;
  const now = Date.now();
  const ms: Record<Exclude<Range, "all">, number> = {
    "1h": 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
  };
  return data.filter(r => now - r.ts <= ms[range]);
}

function tempColor(t: number): string {
  if (t < 0) return "#38bdf8";
  if (t < 10) return "#6c8ef5";
  if (t < 20) return "#34d399";
  if (t < 28) return "#fbbf24";
  return "#f87171";
}

// ============================================================
// КОМПОНЕНТИ — Stat Card
// ============================================================
function StatCard({ label, value, unit, sub, color }: {
  label: string; value: string; unit: string; sub?: string; color: string;
}) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "16px 20px", flex: 1, minWidth: 120,
    }}>
      <div style={{ fontSize: "0.7rem", color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: 700, color, fontFamily: "var(--mono)", lineHeight: 1 }}>
        {value}<span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--muted)", marginLeft: 4 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ============================================================
// КОМПОНЕНТ — Custom Tooltip для графіка
// ============================================================
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: "0.82rem" }}>
      <div style={{ color: "var(--muted)", marginBottom: 6, fontFamily: "var(--mono)" }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</strong>
          {p.name === "Temperatur" ? " °C" : " %"}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// КОМПОНЕНТ — Device Badge
// ============================================================
function DeviceBadge({ name, active, onClick }: { name: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 12px", borderRadius: 99, fontSize: "0.75rem",
      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
      background: active ? "rgba(108,142,245,0.15)" : "var(--surface2)",
      color: active ? "var(--accent)" : "var(--muted)",
      cursor: "pointer", fontFamily: "var(--mono)", transition: "all 0.15s",
    }}>
      {name}
    </button>
  );
}

// ============================================================
// ГОЛОВНА СТОРІНКА
// ============================================================
export default function Dashboard() {
  const [allData, setAllData] = useState<SensorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [range, setRange] = useState<Range>("6h");
  const [activeDevices, setActiveDevices] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/sensor?limit=500");
      if (!res.ok) throw new Error("fetch failed");
      const json: SensorRecord[] = await res.json();
      setAllData(json);
      setLastUpdated(new Date());
      setError(false);

      // Автоматично активувати всі девайси при першому завантаженні
      setActiveDevices(prev => {
        if (prev.size === 0) {
          const devices = new Set(json.map(r => r.d));
          return devices;
        }
        return prev;
      });
    } catch {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 15_000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  // Фільтрація
  const devices = Array.from(new Set(allData.map(r => r.d))).sort();
  const filtered = filterByRange(allData, range)
    .filter(r => activeDevices.has(r.d));

  // Дані для графіка
  const chartData = filtered.map(r => ({
    time: formatTime(r.ts, range),
    ts: r.ts,
    Temperatur: Math.round(r.t * 10) / 10,
    Luftfeuchtigkeit: r.h !== null ? Math.round((r.h ?? 0) * 10) / 10 : null,
    device: r.d,
  }));

  // Статистика
  const temps = filtered.map(r => r.t);
  const humids = filtered.map(r => r.h).filter((h): h is number => h !== null);
  const tempStats = calcStats(temps);
  const humidStats = calcStats(humids);

  const ranges: { id: Range; label: string }[] = [
    { id: "1h", label: "1 Std." },
    { id: "6h", label: "6 Std." },
    { id: "24h", label: "24 Std." },
    { id: "7d", label: "7 Tage" },
    { id: "all", label: "Alles" },
  ];

  // Колір останньої температури
  const lastTemp = allData[allData.length - 1]?.t;
  const lastColor = lastTemp !== undefined ? tempColor(lastTemp) : "var(--accent)";

  return (
    <div style={{
      background: "var(--bg)", color: "var(--text)", fontFamily: "var(--sans)",
      minHeight: "100vh", padding: "0 16px 60px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      {/* ── HEADER ── */}
      <header style={{
        width: "100%", maxWidth: 960,
        padding: "24px 0 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)", marginBottom: 24,
        flexWrap: "wrap" as const, gap: 12,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ fontFamily: "var(--mono)", fontSize: "1.4rem", color: "var(--accent)" }}>
              sensor.dashboard
            </h1>
            <span style={{ fontSize: "0.72rem", color: "var(--muted)", background: "var(--surface2)", padding: "2px 10px", borderRadius: 99, border: "1px solid var(--border)" }}>
              ESP32 · Upstash Redis
            </span>
          </div>
          {lastUpdated && (
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4, fontFamily: "var(--mono)" }}>
              Aktualisiert: {lastUpdated.toLocaleTimeString("de-DE")}
              {autoRefresh && <span style={{ color: "var(--green)", marginLeft: 8 }}>● live</span>}
            </div>
          )}
        </div>

        {/* Авто-рефреш кнопка */}
        <button onClick={() => setAutoRefresh(v => !v)} style={{
          padding: "7px 16px", borderRadius: 8, cursor: "pointer",
          border: `1px solid ${autoRefresh ? "var(--green)" : "var(--border)"}`,
          background: autoRefresh ? "rgba(52,211,153,0.1)" : "var(--surface2)",
          color: autoRefresh ? "var(--green)" : "var(--muted)",
          fontSize: "0.8rem", fontFamily: "var(--sans)", transition: "all 0.2s",
        }}>
          {autoRefresh ? "⏸ Auto-Update AN" : "▶ Auto-Update AUS"}
        </button>
      </header>

      <div style={{ width: "100%", maxWidth: 960 }}>

        {/* ── LOADING / ERROR ── */}
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>📡</div>
            Verbindung wird hergestellt…
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid var(--red)", borderRadius: 12, padding: "20px 24px", color: "var(--red)", marginBottom: 24 }}>
            ⚠ Fehler beim Laden der Sensordaten. Bitte API-Route <code style={{ fontFamily: "var(--mono)", background: "rgba(248,113,113,0.15)", padding: "1px 6px", borderRadius: 4 }}>/api/sensor</code> prüfen.
          </div>
        )}

        {!loading && !error && allData.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🔌</div>
            <div style={{ fontSize: "1rem", marginBottom: 8 }}>Keine Daten vorhanden</div>
            <div style={{ fontSize: "0.82rem" }}>ESP32 muss erst Daten an <code style={{ fontFamily: "var(--mono)" }}>POST /api/sensor</code> senden</div>
          </div>
        )}

        {!loading && allData.length > 0 && (
          <>
            {/* ── STAT CARDS ── */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" as const }}>
              {tempStats && <>
                <StatCard label="Aktuell" value={tempStats.last.toFixed(1)} unit="°C" sub={`Gerät: ${allData[allData.length - 1]?.d}`} color={lastColor} />
                <StatCard label="Maximum" value={tempStats.max.toFixed(1)} unit="°C" sub={`aus ${tempStats.count} Messungen`} color="#f87171" />
                <StatCard label="Minimum" value={tempStats.min.toFixed(1)} unit="°C" sub="im gewählten Zeitraum" color="#38bdf8" />
                <StatCard label="Durchschnitt" value={tempStats.avg.toFixed(1)} unit="°C" sub="Mittelwert" color="#a78bfa" />
              </>}
              {humidStats && (
                <StatCard label="Luftfeuchtigkeit" value={humidStats.last.toFixed(0)} unit="%" sub={`⌀ ${humidStats.avg.toFixed(0)}%`} color="#34d399" />
              )}
            </div>

            {/* ── FILTER BAR ── */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap" as const }}>
              {/* Zeitraum */}
              <div style={{ display: "flex", gap: 4, background: "var(--surface2)", padding: 3, borderRadius: 9, border: "1px solid var(--border)" }}>
                {ranges.map(r => (
                  <button key={r.id} onClick={() => setRange(r.id)} style={{
                    padding: "5px 12px", borderRadius: 7, border: "none",
                    background: range === r.id ? "var(--accent)" : "transparent",
                    color: range === r.id ? "#fff" : "var(--muted)",
                    fontSize: "0.78rem", cursor: "pointer", fontFamily: "var(--sans)",
                    fontWeight: range === r.id ? 600 : 400, transition: "all 0.15s",
                  }}>
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Девайси */}
              {devices.length > 1 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                  {devices.map(d => (
                    <DeviceBadge key={d} name={d} active={activeDevices.has(d)}
                      onClick={() => setActiveDevices(prev => {
                        const next = new Set(prev);
                        if (next.has(d)) next.delete(d); else next.add(d);
                        return next;
                      })}
                    />
                  ))}
                </div>
              )}

              {/* Кількість точок */}
              <div style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                {filtered.length} Messpunkte
              </div>
            </div>

            {/* ── TEMPERATUR CHART ── */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 16px 12px", marginBottom: 20 }}>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 14, paddingLeft: 8 }}>
                Temperaturverlauf
              </div>
              {chartData.length < 2 ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: "0.85rem" }}>
                  Nicht genug Daten für den gewählten Zeitraum
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="var(--muted)"
                      tick={{ fontSize: 11, fill: "var(--muted)" }}
                      interval="preserveStartEnd"
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--muted)"
                      tick={{ fontSize: 11, fill: "var(--muted)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `${v}°`}
                      domain={["auto", "auto"]}
                      width={36}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#38bdf8" strokeDasharray="4 4" strokeOpacity={0.4} />
                    <ReferenceLine y={25} stroke="#fbbf24" strokeDasharray="4 4" strokeOpacity={0.4} />
                    <Line
                      type="monotone"
                      dataKey="Temperatur"
                      stroke="#6c8ef5"
                      strokeWidth={2}
                      dot={chartData.length < 60 ? { r: 3, fill: "#6c8ef5" } : false}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── LUFTFEUCHTIGKEIT CHART (якщо є дані) ── */}
            {humidStats && chartData.some(d => d.Luftfeuchtigkeit !== null) && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 16px 12px", marginBottom: 20 }}>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 14, paddingLeft: 8 }}>
                  Luftfeuchtigkeit
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="time" stroke="var(--muted)" tick={{ fontSize: 11, fill: "var(--muted)" }} interval="preserveStartEnd" tickLine={false} />
                    <YAxis stroke="var(--muted)" tick={{ fontSize: 11, fill: "var(--muted)" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} width={36} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={60} stroke="#fbbf24" strokeDasharray="4 4" strokeOpacity={0.4} />
                    <Line type="monotone" dataKey="Luftfeuchtigkeit" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 5 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── ТАБЛИЦЯ ОСТАННІХ ЗАПИСІВ ── */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                  Letzte Messungen
                </div>
                <button onClick={load} style={{ padding: "4px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--muted)", fontSize: "0.75rem", cursor: "pointer" }}>
                  ↻ Neu laden
                </button>
              </div>
              <div style={{ overflowX: "auto" as const }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "var(--surface2)" }}>
                      {["Zeit", "Gerät", "Temperatur", "Luftfeuchtigkeit"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left" as const, color: "var(--muted)", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.05em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered].reverse().slice(0, 20).map((r, i) => (
                      <tr key={r.ts + i} style={{ borderTop: "1px solid var(--border)", transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "10px 16px", fontFamily: "var(--mono)", color: "var(--muted)", whiteSpace: "nowrap" as const }}>
                          {new Date(r.ts).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ fontSize: "0.7rem", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 8px", fontFamily: "var(--mono)", color: "var(--accent)" }}>
                            {r.d}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px", fontFamily: "var(--mono)", fontWeight: 700, color: tempColor(r.t) }}>
                          {r.t.toFixed(1)} °C
                        </td>
                        <td style={{ padding: "10px 16px", fontFamily: "var(--mono)", color: "var(--green)" }}>
                          {r.h !== null ? `${r.h.toFixed(0)} %` : <span style={{ color: "var(--muted)" }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}
