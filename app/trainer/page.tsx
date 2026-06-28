"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================
// ТИПИ
// ============================================================
type TabName = "meanings" | "quiz" | "builder" | "perfekt" | "leaderboard";
type QuizMode = "quiz" | "perfekt";

interface LeaderboardEntry {
  name: string;
  score: number;
  rank: number;
}

// ============================================================
// ДАНІ
// ============================================================
const meanings = [
  {
    num: "1", tag: "nicht mitnehmen", title: "Залишити / не брати з собою",
    examples: [
      { de: "Kann ich meinen Koffer hier lassen?", ua: "Можна залишити валізу тут?" },
      { de: "Ich habe meinen Koffer hier gelassen.", ua: "Я залишив валізу тут." },
    ],
    perfekt: "gelassen", color: "#6c8ef5",
  },
  {
    num: "2", tag: "nicht selbst machen", title: "Доручити / через когось",
    examples: [
      { de: "Ich lasse meine Haare schneiden.", ua: "Я стрижуся (у когось)." },
      { de: "Ich habe meine Haare schneiden lassen.", ua: "Я постригся." },
    ],
    perfekt: "(Verb) + lassen", color: "#a78bfa",
  },
  {
    num: "3", tag: "(nicht) erlauben", title: "Дозволяти / не дозволяти",
    examples: [
      { de: "Ich lasse mein Kind nicht fernsehen.", ua: "Я не дозволяю дитині дивитися ТВ." },
      { de: "Ich habe mein Kind nicht fernsehen lassen.", ua: "(перфект)" },
    ],
    perfekt: "(Verb) + lassen", color: "#34d399",
  },
  {
    num: "4", tag: "Aufforderung zu Aktion", title: "Заклик до спільної дії",
    examples: [{ de: "Lass(t) uns gehen!", ua: "Ходімо! / Давай підемо!" }],
    perfekt: "— (kein Perfekt)", color: "#fbbf24",
  },
  {
    num: "5", tag: "etwas für jemanden tun", title: "Зробити щось для когось",
    examples: [{ de: "Lass mich ihn tragen.", ua: "Дай я понесу (для тебе)." }],
    perfekt: "— (kein Perfekt)", color: "#f87171",
  },
  {
    num: "6", tag: "kann … werden", title: "Можливість / пасивний потенціал",
    examples: [
      { de: "Viele Krankheiten lassen sich heilen.", ua: "Багато хвороб піддаються лікуванню." },
      { de: "Sie haben sich heilen lassen.", ua: "(перфект)" },
    ],
    perfekt: "(Verb) + lassen", color: "#38bdf8",
  },
  {
    num: "7", tag: "nicht machen / aufhören", title: "Припинити / перестати",
    examples: [
      { de: "Viele Leute können das Rauchen nicht lassen.", ua: "Багато людей не можуть кинути курити." },
      { de: "Er hat das Rauchen nicht gelassen.", ua: "(перфект)" },
    ],
    perfekt: "gelassen", color: "#fb923c",
  },
  {
    num: "8", tag: "der Grund sein", title: "Бути причиною / спонукати",
    examples: [
      { de: "Das schlechte Wetter ließ sie depressiv werden.", ua: "Погода змусила її впасти у депресію." },
      { de: "Es hat sie depressiv werden lassen.", ua: "(перфект)" },
    ],
    perfekt: "(Verb) + lassen", color: "#e879f9",
  },
];

const quizQuestions = [
  { q: "«Das Erdbeben ließ viele Häuser einstürzen.» — яке значення lassen?", correct: "der Grund sein (бути причиною)", options: ["nicht mitnehmen", "der Grund sein (бути причиною)", "nicht machen / aufhören", "Aufforderung zu Aktion"], explanation: "Землетрус спричинив руйнування — lassen = бути причиною (Bed. 8)." },
  { q: "«Lass doch das Trinken!» — яке значення lassen?", correct: "nicht machen / aufhören", options: ["etwas für jemanden tun", "nicht selbst machen", "nicht machen / aufhören", "der Grund sein"], explanation: "Припини пити! — lassen = перестати (Bed. 7)." },
  { q: "«Kann ich meinen Koffer am Flughafen lassen?» — яке значення?", correct: "nicht mitnehmen (залишити)", options: ["nicht mitnehmen (залишити)", "(nicht) erlauben", "nicht selbst machen", "kann … werden"], explanation: "Залишити валізу — lassen = nicht mitnehmen (Bed. 1)." },
  { q: "«Ich möchte meine Wohnung renovieren lassen.» — яке значення?", correct: "nicht selbst machen (доручити)", options: ["nicht machen / aufhören", "nicht selbst machen (доручити)", "der Grund sein", "Aufforderung zu Aktion"], explanation: "Хочу щоб хтось відремонтував — Bed. 2." },
  { q: "«Wir haben den Vogel fliegen lassen.» — яке значення?", correct: "(nicht) erlauben / дозволити", options: ["nicht mitnehmen", "nicht machen / aufhören", "(nicht) erlauben / дозволити", "etwas für jemanden tun"], explanation: "Відпустили птаха — lassen = erlauben (Bed. 3)." },
  { q: "«Lasst uns endlich aufhören zu arbeiten!» — яке значення?", correct: "Aufforderung zu Aktion", options: ["nicht machen / aufhören", "Aufforderung zu Aktion", "etwas für jemanden tun", "der Grund sein"], explanation: "Давайте закінчимо! — спільний заклик (Bed. 4)." },
  { q: "«Lass mich das machen! Ich habe Zeit.» — яке значення?", correct: "etwas für jemanden tun", options: ["nicht selbst machen", "kann … werden", "etwas für jemanden tun", "nicht mitnehmen"], explanation: "Дай я це зроблю — пропозиція допомоги (Bed. 5)." },
  { q: "«Lässt sich das Auto noch reparieren?» — яке значення?", correct: "kann … werden (потенціал)", options: ["der Grund sein", "nicht machen / aufhören", "(nicht) erlauben", "kann … werden (потенціал)"], explanation: "Чи можна відремонтувати? — sich lassen = kann werden (Bed. 6)." },
  { q: "Perfekt: «Ich habe meine Haare schneiden ___»", correct: "lassen", options: ["gelassen", "lassen", "zu lassen", "lässt"], explanation: "З іншим дієсловом → Verb + lassen (не gelassen)." },
  { q: "Perfekt: «Er hat das Rauchen nicht ___»", correct: "gelassen", options: ["lassen", "gelassen", "lässt", "zu lassen"], explanation: "Без іншого дієслова → gelassen (Bed. 7)." },
  { q: "Perfekt: «Sie haben sich heilen ___»", correct: "lassen", options: ["gelassen", "lassen", "lässt", "zu lassen"], explanation: "sich lassen + Infinitiv → Verb + lassen." },
  { q: "«Ich lasse mein Kind NICHT fernsehen.» — яке значення lassen?", correct: "(nicht) erlauben — НЕ дозволяти", options: ["nicht mitnehmen", "nicht machen / aufhören", "nicht selbst machen", "(nicht) erlauben — НЕ дозволяти"], explanation: "Не дозволяю дивитися ТВ — Bed. 3." },
];

const perfektQuestions = [
  { q: "«Ich habe meinen Koffer hier ___» (залишив, без другого дієслова)", correct: "gelassen", options: ["lassen", "gelassen", "gelasst", "lässt"], explanation: "Bed. 1 — lassen без іншого дієслова → gelassen." },
  { q: "«Ich habe meine Haare schneiden ___» (у майстра)", correct: "lassen", options: ["gelassen", "lassen", "gelasst", "zu lassen"], explanation: "Bed. 2 — два дієслова → Verb + lassen." },
  { q: "«Er hat das Rauchen nicht ___»", correct: "gelassen", options: ["lassen", "gelassen", "lässt", "gelasst"], explanation: "Bed. 7 — lassen без іншого дієслова → gelassen." },
  { q: "«Das Wetter hat sie depressiv werden ___»", correct: "lassen", options: ["gelassen", "lassen", "gelasst", "zu lassen"], explanation: "Bed. 8 — два дієслова → Verb + lassen." },
  { q: "«Ich habe mein Kind nicht fernsehen ___»", correct: "lassen", options: ["gelassen", "lassen", "lässt", "gelasst"], explanation: "Bed. 3 — два дієслова → Verb + lassen." },
  { q: "«Sie haben sich heilen ___» (хворі вилікувались)", correct: "lassen", options: ["gelassen", "lassen", "gelasst", "zu lassen"], explanation: "Bed. 6 — sich lassen → Verb + lassen." },
  { q: "Правило: коли Perfekt → GELASSEN?", correct: "Коли lassen без іншого інфінітива (Bed. 1, 7)", options: ["Коли lassen без іншого інфінітива (Bed. 1, 7)", "Завжди", "Коли lassen з іншим дієсловом", "Тільки у значенні 4"], explanation: "Lassen + інфінітив → lassen. Lassen один → gelassen." },
  { q: "«Wir haben ihn warten ___» (змусили чекати)", correct: "lassen", options: ["gelassen", "lassen", "lässt", "zu lassen"], explanation: "warten + lassen → Perfekt: warten lassen." },
];

const sbExercises = [
  { prompt: "Залиш валізу тут! (du, Imperativ)", translation: "", answers: ["Lass den Koffer hier!", "Lass deinen Koffer hier!"], hint: "lassen → Imperativ du = Lass", explanation: "Bed. 1: nicht mitnehmen" },
  { prompt: "Я постриглася у перукаря. (Perfekt)", translation: "Ich habe... schneiden...", answers: ["Ich habe meine Haare schneiden lassen.", "Ich habe mir die Haare schneiden lassen."], hint: "haben + Haare + schneiden + lassen", explanation: "Bed. 2: Perfekt = Verb + lassen" },
  { prompt: "Ходімо нарешті! (Lass uns...)", translation: "", answers: ["Lasst uns endlich gehen!", "Lass uns endlich gehen!"], hint: "Lasst uns / Lass uns + Infinitiv", explanation: "Bed. 4: Aufforderung. Kein Perfekt." },
  { prompt: "Дай я це зроблю — у мене є час.", translation: "", answers: ["Lass mich das machen! Ich habe Zeit.", "Lass mich das tun! Ich habe Zeit."], hint: "Lass mich + Infinitiv", explanation: "Bed. 5: etwas für jemanden tun. Kein Perfekt." },
  { prompt: "Ця проблема не піддається вирішенню. (sich lassen)", translation: "Dieses Problem...", answers: ["Dieses Problem lässt sich nicht lösen.", "Das Problem lässt sich nicht lösen."], hint: "lässt sich + Infinitiv", explanation: "Bed. 6: kann nicht gelöst werden." },
  { prompt: "Я відремонтував машину у майстра. (Perfekt)", translation: "Ich habe das Auto reparieren...", answers: ["Ich habe das Auto reparieren lassen.", "Ich habe mein Auto reparieren lassen."], hint: "haben + reparieren + lassen", explanation: "Bed. 2: Perfekt = Verb + lassen." },
  { prompt: "Він не може кинути куріти.", translation: "Er kann das Rauchen...", answers: ["Er kann das Rauchen nicht lassen."], hint: "nicht + lassen як фінальне дієслово", explanation: "Bed. 7: nicht machen / aufhören." },
  { prompt: "Погана новина змусила її плакати.", translation: "Die schlechte Nachricht...", answers: ["Die schlechte Nachricht ließ sie weinen.", "Die schlechte Nachricht hat sie weinen lassen."], hint: "ließ + Akk + Infinitiv або Perfekt", explanation: "Bed. 8: der Grund sein." },
  { prompt: "Ми не дозволяємо собаці спати на дивані.", translation: "Wir lassen...", answers: ["Wir lassen den Hund nicht auf dem Sofa schlafen.", "Wir lassen unseren Hund nicht auf dem Sofa schlafen."], hint: "lassen + Akk + nicht + Infinitiv", explanation: "Bed. 3: nicht erlauben." },
  { prompt: "Залишіть мені повідомлення! (ihr, Imperativ)", translation: "", answers: ["Lasst mir eine Nachricht!"], hint: "Lasst = Imperativ für ihr", explanation: "Imperativ ihr von lassen = Lasst." },
  { prompt: "Чи можна автоматизувати це завдання? (sich lassen)", translation: "Lässt sich diese Aufgabe...?", answers: ["Lässt sich diese Aufgabe automatisieren?", "Lässt sich die Aufgabe automatisieren?"], hint: "Lässt sich + Infinitiv (питання)", explanation: "Bed. 6 у DevOps-контексті." },
  { prompt: "Вона попросила відремонтувати сервер. (Perfekt)", translation: "Sie hat den Server reparieren...", answers: ["Sie hat den Server reparieren lassen."], hint: "hat + reparieren + lassen", explanation: "Bed. 2: Perfekt = Verb + lassen." },
];

// ============================================================
// УТИЛІТИ
// ============================================================
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[.,!?]/g, "").replace(/\s+/g, " ");
}

// ============================================================
// КОМПОНЕНТИ
// ============================================================

// --- Картка значення ---
function MeaningCard({ m }: { m: typeof meanings[0] }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
      padding: 18, position: "relative", overflow: "hidden",
    }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: m.color, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, display: "inline-block" }} />
        {m.tag}
      </div>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 10 }}>{m.num}. {m.title}</h3>
      {m.examples.map((e, i) => (
        <div key={i}>
          <div style={{ fontSize: "0.82rem", color: "var(--accent)", fontStyle: "italic", lineHeight: 1.5 }}>{e.de}</div>
          <div style={{ fontSize: "0.77rem", color: "var(--muted)", marginBottom: 4 }}>{e.ua}</div>
        </div>
      ))}
      <span style={{ display: "inline-block", marginTop: 10, fontSize: "0.68rem", fontFamily: "var(--mono)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 8px", color: "var(--yellow)" }}>
        Perfekt: {m.perfekt}
      </span>
    </div>
  );
}

// --- Квіз (исправленный) ---
function QuizSection({ questions, mode }: { questions: typeof quizQuestions; mode: QuizMode }) {
  // Флаг, указывающий, что мы на клиенте (после гидратации)
  const [isClient, setIsClient] = useState(false);
  // Данные квиза (перемешанные) – инициализируем пустыми
  const [shuffled, setShuffled] = useState<typeof questions>([]);
  const [opts, setOpts] = useState<string[][]>([]);

  // После монтирования на клиенте генерируем случайные порядки
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const s = shuffle(questions);
      setShuffled(s);
      setOpts(s.map(q => shuffle(q.options)));
    }
  }, [isClient, questions]);

  // На сервере и во время первой клиентской отрисовки показываем заглушку,
  // чтобы избежать расхождений с серверным HTML.
  if (!isClient || shuffled.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: "1.2rem", color: "var(--muted)" }}>Завантаження…</div>
      </div>
    );
  }

  // ========== Внутренний стейт квиза (инициализируется только после isClient) ==========
  const [idx, setIdx] = useState(0);
  const [ok, setOk] = useState(0);
  const [bad, setBad] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [myRank, setMyRank] = useState<number | null>(null);

  const q = shuffled[idx];
  const total = shuffled.length;
  const pct = Math.round((ok / total) * 100);

  function select(opt: string) {
    if (chosen) return;
    setChosen(opt);
    if (opt === q.correct) setOk(v => v + 1);
    else setBad(v => v + 1);
  }

  function next() {
    if (idx + 1 >= total) setDone(true);
    else { setIdx(i => i + 1); setChosen(null); }
  }

  async function saveScore() {
    if (!saveName.trim()) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveName.trim(), score: ok, mode }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaved(true);
        setSaveStatus("ok");
        if (data.rank) setMyRank(data.rank);
      } else {
        setSaveStatus("err");
      }
    } catch {
      setSaveStatus("err");
    }
  }

  function restart() {
    // Сбрасываем состояние, но оставляем перемешанные вопросы неизменными
    setIdx(0); setOk(0); setBad(0); setChosen(null);
    setDone(false); setSaved(false); setSaveName("");
    setSaveStatus("idle"); setMyRank(null);
  }

  if (done) {
    const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚";
    const msg = pct >= 80 ? "Відмінно!" : pct >= 50 ? "Непогано, продовжуй!" : "Потренуйся ще раз!";
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>{emoji}</div>
        <h2 style={{ fontSize: "1.4rem", marginBottom: 8 }}>{msg}</h2>
        <p style={{ color: "var(--muted)", marginBottom: 28 }}>
          Результат: <strong style={{ color: "var(--green)" }}>{ok}</strong> / {total} ({pct}%)
        </p>

        {/* Форма збереження */}
        {!saved ? (
          <div style={{ maxWidth: 360, margin: "0 auto 24px", textAlign: "left" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 8, textAlign: "center" }}>
              Зберегти результат у таблицю лідерів?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveScore()}
                placeholder="Твоє ім'я..."
                maxLength={30}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 9,
                  border: "1.5px solid var(--border)", background: "var(--surface2)",
                  color: "var(--text)", fontSize: "0.9rem", fontFamily: "var(--sans)", outline: "none",
                }}
              />
              <button
                onClick={saveScore}
                disabled={saveStatus === "saving" || !saveName.trim()}
                style={{
                  padding: "10px 18px", borderRadius: 9, background: "var(--accent)",
                  color: "#fff", border: "none", fontFamily: "var(--sans)", fontWeight: 600,
                  fontSize: "0.85rem", cursor: "pointer", opacity: saveStatus === "saving" ? 0.6 : 1,
                }}
              >
                {saveStatus === "saving" ? "…" : "Зберегти"}
              </button>
            </div>
            {saveStatus === "err" && <div style={{ color: "var(--red)", fontSize: "0.78rem", marginTop: 6 }}>Помилка збереження. Перевір підключення.</div>}
          </div>
        ) : (
          <div style={{ background: "rgba(52,211,153,0.1)", border: "1px solid var(--green)", borderRadius: 10, padding: "12px 20px", maxWidth: 360, margin: "0 auto 24px", color: "var(--green)", fontSize: "0.88rem" }}>
            ✓ Збережено! {myRank && <span>Твій ранг: <strong>#{myRank}</strong></span>}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={restart} style={{ padding: "11px 24px", borderRadius: 10, background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)", fontFamily: "var(--sans)", fontSize: "0.9rem", cursor: "pointer" }}>
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 28px 24px" }}>
      {/* Прогрес */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.75rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
        <span>✓ <span style={{ color: "var(--green)" }}>{ok}</span> &nbsp; ✗ <span style={{ color: "var(--red)" }}>{bad}</span></span>
        <span>{idx + 1} / {total}</span>
      </div>
      <div style={{ width: "100%", height: 3, background: "var(--border)", borderRadius: 99, marginBottom: 22, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg, var(--accent), var(--accent2))", width: `${(idx / total) * 100}%`, transition: "width 0.4s" }} />
      </div>

      {/* Питання */}
      <div style={{ fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.5, marginBottom: 22, minHeight: 52 }}
        dangerouslySetInnerHTML={{ __html: q.q }} />

      {/* Варіанти */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {opts[idx].map(opt => {
          let bg = "var(--surface2)", borderColor = "var(--border)", color = "var(--text)";
          if (chosen) {
            if (opt === q.correct) { bg = "rgba(52,211,153,0.1)"; borderColor = "var(--green)"; color = "var(--green)"; }
            else if (opt === chosen) { bg = "rgba(248,113,113,0.1)"; borderColor = "var(--red)"; color = "var(--red)"; }
          }
          return (
            <button key={opt} onClick={() => select(opt)} disabled={!!chosen}
              style={{ padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${borderColor}`, background: bg, color, fontSize: "0.84rem", fontFamily: "var(--sans)", cursor: chosen ? "default" : "pointer", textAlign: "left", lineHeight: 1.4, transition: "all 0.15s" }}>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Пояснення */}
      {chosen && (
        <div style={{ borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: "0.83rem", lineHeight: 1.5, background: chosen === q.correct ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${chosen === q.correct ? "var(--green)" : "var(--red)"}`, color: chosen === q.correct ? "var(--green)" : "var(--red)" }}>
          {chosen === q.correct ? "✓ Правильно!" : "✗ Неправильно."}
          <div style={{ color: "var(--text)", marginTop: 5, fontSize: "0.79rem" }}>{q.explanation}</div>
        </div>
      )}

      {chosen && (
        <button onClick={next} style={{ width: "100%", padding: 12, borderRadius: 10, background: "var(--accent)", color: "#fff", border: "none", fontFamily: "var(--sans)", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
          Далі →
        </button>
      )}
    </div>
  );
}

// --- Побудова речень (без изменений) ---
function BuilderSection() {
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "bad" | "skip">("idle");
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ex = sbExercises[idx];

  function check() {
    const isOk = ex.answers.some(a => normalize(a) === normalize(val));
    setStatus(isOk ? "ok" : "bad");
  }

  function next() {
    if (idx + 1 >= sbExercises.length) setDone(true);
    else { setIdx(i => i + 1); setVal(""); setStatus("idle"); setTimeout(() => inputRef.current?.focus(), 50); }
  }

  function hint() {
    setStatus("skip");
  }

  if (done) return (
    <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)" }}>
      <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎉</div>
      <h2 style={{ marginBottom: 8 }}>Завдання завершено!</h2>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>Всі {sbExercises.length} вправ пройдено.</p>
      <button onClick={() => { setIdx(0); setVal(""); setStatus("idle"); setDone(false); }}
        style={{ padding: "11px 24px", borderRadius: 10, background: "var(--accent)", color: "#fff", border: "none", fontFamily: "var(--sans)", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
        Почати знову
      </button>
    </div>
  );

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
      <div style={{ fontSize: "0.73rem", color: "var(--muted)", fontFamily: "var(--mono)", marginBottom: 16 }}>Завдання {idx + 1} / {sbExercises.length}</div>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--accent2)", marginBottom: 6 }}>Перекладіть / Доповніть</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 4 }}>{ex.prompt}</div>
      {ex.translation && <div style={{ fontSize: "0.82rem", color: "var(--muted)", fontStyle: "italic", marginBottom: 18 }}>{ex.translation}</div>}

      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && status === "idle" && check()}
          placeholder="Введіть відповідь..."
          style={{ flex: 1, minWidth: 200, padding: "12px 16px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: "0.9rem", fontFamily: "var(--sans)", outline: "none" }} />
        {status === "idle" && (
          <button onClick={check} style={{ padding: "12px 22px", borderRadius: 10, background: "var(--accent)", color: "#fff", border: "none", fontFamily: "var(--sans)", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}>
            Перевірити
          </button>
        )}
      </div>

      {status === "idle" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button onClick={hint} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--yellow)", fontFamily: "var(--sans)", fontSize: "0.8rem", cursor: "pointer" }}>
            💡 Підказка
          </button>
        </div>
      )}

      {status === "skip" && (
        <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid var(--yellow)", borderRadius: 10, padding: "12px 16px", fontSize: "0.83rem", color: "var(--yellow)", marginBottom: 14 }}>
          💡 {ex.hint}
        </div>
      )}

      {(status === "ok" || status === "bad") && (
        <div style={{ background: status === "ok" ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${status === "ok" ? "var(--green)" : "var(--red)"}`, borderRadius: 10, padding: "12px 16px", fontSize: "0.83rem", color: status === "ok" ? "var(--green)" : "var(--red)", marginBottom: 14 }}>
          {status === "ok" ? "✓ Чудово!" : "✗ Не зовсім. Правильна відповідь:"}
          <div style={{ fontFamily: "var(--mono)", color: "var(--text)", marginTop: 5, fontSize: "0.8rem" }}>{ex.answers[0]}</div>
          <div style={{ color: "var(--muted)", marginTop: 4, fontSize: "0.77rem" }}>{ex.explanation}</div>
        </div>
      )}

      {status !== "idle" && (
        <button onClick={next} style={{ width: "100%", padding: 12, borderRadius: 10, background: "var(--accent)", color: "#fff", border: "none", fontFamily: "var(--sans)", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
          Далі →
        </button>
      )}
    </div>
  );
}

// --- Таблиця лідерів (без изменений) ---
function LeaderboardSection() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true); setError(false);
    try {
      const res = await fetch("/api/scores");
      const json = await res.json();
      setData(json);
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>🏆 Таблиця лідерів</h2>
        <button onClick={load} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--muted)", fontSize: "0.78rem", fontFamily: "var(--sans)", cursor: "pointer" }}>
          ↻ Оновити
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>Завантаження…</div>}
      {error && <div style={{ textAlign: "center", color: "var(--red)", padding: 40 }}>Помилка завантаження. Перевір налаштування Upstash.</div>}

      {!loading && !error && data.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>
          Ще немає результатів. Пройди тест і збережи своє ім&apos;я!
        </div>
      )}

      {!loading && data.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.map((entry, i) => {
            // Ім'я може містити __mode суфікс — прибираємо
            const displayName = entry.name.includes("__") ? entry.name.split("__")[0] : entry.name;
            const modeTag = entry.name.includes("__") ? entry.name.split("__")[1] : "";
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                borderRadius: 10, background: i < 3 ? "var(--surface2)" : "transparent",
                border: i < 3 ? "1px solid var(--border)" : "1px solid transparent",
              }}>
                <span style={{ fontSize: i < 3 ? "1.4rem" : "0.9rem", minWidth: 32, textAlign: "center", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                  {i < 3 ? medals[i] : `#${entry.rank}`}
                </span>
                <span style={{ flex: 1, fontWeight: i === 0 ? 700 : 400 }}>{displayName}</span>
                {modeTag && (
                  <span style={{ fontSize: "0.65rem", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 7px", color: "var(--muted)", fontFamily: "var(--mono)" }}>
                    {modeTag}
                  </span>
                )}
                <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: i === 0 ? "var(--yellow)" : "var(--accent)", fontSize: "0.95rem" }}>
                  {entry.score} pts
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ГОЛОВНА СТОРІНКА
// ============================================================
export default function TrainerPage() {
  const [tab, setTab] = useState<TabName>("meanings");

  const tabs: { id: TabName; label: string }[] = [
    { id: "meanings", label: "📚 Значення" },
    { id: "quiz", label: "🎯 Тест" },
    { id: "builder", label: "✍️ Речення" },
    { id: "perfekt", label: "⏱ Перфект" },
    { id: "leaderboard", label: "🏆 Лідери" },
  ];

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--sans)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 60px" }}>

      {/* Header */}
      <header style={{ width: "100%", maxWidth: 860, padding: "28px 0 12px", display: "flex", alignItems: "baseline", gap: 14, borderBottom: "1px solid var(--border)", marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--mono)", fontSize: "1.5rem", color: "var(--accent)", letterSpacing: "-0.5px" }}>lassen</h1>
        <span style={{ fontSize: "0.75rem", color: "var(--muted)", background: "var(--surface2)", padding: "2px 10px", borderRadius: 99, border: "1px solid var(--border)" }}>B2 · Verb Trainer</span>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, width: "100%", maxWidth: 860, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${tab === t.id ? "var(--accent)" : "var(--border)"}`, background: tab === t.id ? "var(--accent)" : "var(--surface)", color: tab === t.id ? "#fff" : "var(--muted)", fontSize: "0.8rem", fontFamily: "var(--sans)", cursor: "pointer", fontWeight: tab === t.id ? 600 : 400, transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ width: "100%", maxWidth: 860 }}>
        {tab === "meanings" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {meanings.map(m => <MeaningCard key={m.num} m={m} />)}
          </div>
        )}
        {tab === "quiz" && <QuizSection key="quiz" questions={quizQuestions} mode="quiz" />}
        {tab === "builder" && <BuilderSection key="builder" />}
        {tab === "perfekt" && <QuizSection key="perfekt" questions={perfektQuestions} mode="perfekt" />}
        {tab === "leaderboard" && <LeaderboardSection />}
      </div>
    </div>
  );
}