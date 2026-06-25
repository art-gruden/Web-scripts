import { useState, useCallback } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const RULE = {
  structure: [
    { part: "Je", role: "союз", color: "#a78bfa" },
    { part: "+ Komparativ", role: "порівняльна ступінь", color: "#60a5fa" },
    { part: "+ Nebensatz (дієслово в кінці)", role: "підрядне речення", color: "#34d399" },
    { part: "desto", role: "союз", color: "#f59e0b" },
    { part: "+ Komparativ", role: "порівняльна ступінь", color: "#60a5fa" },
    { part: "+ Verb + Subjekt", role: "головне речення (інверсія!)", color: "#f87171" },
  ],
  examples: [
    {
      je: "Je mehr ich lerne,",
      desto: "desto besser werde ich.",
      ua: "Чим більше я вчуся, тим кращим я стаю."
    },
    {
      je: "Je länger du wartest,",
      desto: "desto schwieriger wird es.",
      ua: "Чим довше ти чекаєш, тим важче це стає."
    }
  ]
};

// Exercise types: "build" = drag words, "fill" = fill blanks, "translate" = choose correct
const EXERCISES = [
  // ── BUILD exercises ────────────────────────────────────────────────────────
  {
    type: "build",
    instruction: "Склади речення з поданих слів",
    words: ["Je", "mehr", "du", "übst,", "desto", "besser", "wirst", "du"],
    answer: "Je mehr du übst, desto besser wirst du",
    translation: "Чим більше ти практикуєшся, тим кращим ти стаєш."
  },
  {
    type: "build",
    instruction: "Склади речення з поданих слів",
    words: ["Je", "früher", "du", "aufstehst,", "desto", "produktiver", "ist", "der", "Tag"],
    answer: "Je früher du aufstehst, desto produktiver ist der Tag",
    translation: "Чим раніше ти встаєш, тим продуктивнішим є день."
  },
  {
    type: "build",
    instruction: "Склади речення з поданих слів",
    words: ["Je", "lauter", "er", "spricht,", "desto", "weniger", "hört", "man", "ihm", "zu"],
    answer: "Je lauter er spricht, desto weniger hört man ihm zu",
    translation: "Чим гучніше він говорить, тим менше його слухають."
  },
  {
    type: "build",
    instruction: "Склади речення з поданих слів",
    words: ["Je", "weniger", "du", "schläfst,", "desto", "müder", "bist", "du"],
    answer: "Je weniger du schläfst, desto müder bist du",
    translation: "Чим менше ти спиш, тим втомленішим ти є."
  },
  {
    type: "build",
    instruction: "Склади речення з поданих слів",
    words: ["Je", "mehr", "man", "reist,", "desto", "offener", "wird", "man"],
    answer: "Je mehr man reist, desto offener wird man",
    translation: "Чим більше мандруєш, тим відкритішою людиною стаєш."
  },

  // ── FILL exercises ─────────────────────────────────────────────────────────
  {
    type: "fill",
    instruction: "Вибери правильну форму Komparativ",
    template: "Je ___ das Problem ist, desto ___ brauchen wir, um es zu lösen.",
    blanks: [
      { options: ["schwieriger", "schwierig", "schwierigste"], correct: 0 },
      { options: ["mehr Zeit", "viel Zeit", "meiste Zeit"], correct: 0 },
    ],
    translation: "Чим складніша проблема, тим більше часу нам потрібно для її вирішення."
  },
  {
    type: "fill",
    instruction: "Вибери правильну форму Komparativ",
    template: "Je ___ ich arbeite, desto ___ verdiene ich.",
    blanks: [
      { options: ["fleißiger", "fleißig", "am fleißigsten"], correct: 0 },
      { options: ["mehr", "viel", "meiste"], correct: 0 },
    ],
    translation: "Чим старанніше я працюю, тим більше заробляю."
  },
  {
    type: "fill",
    instruction: "Вибери правильну форму Komparativ",
    template: "Je ___ das Wetter ist, desto ___ sind die Menschen.",
    blanks: [
      { options: ["schöner", "schön", "schönste"], correct: 0 },
      { options: ["fröhlicher", "fröhlich", "am fröhlichsten"], correct: 0 },
    ],
    translation: "Чим гарніша погода, тим веселіші люди."
  },

  // ── ORDER exercises ────────────────────────────────────────────────────────
  {
    type: "order",
    instruction: "Відновіть правильний порядок частин речення",
    parts: [
      "desto glücklicher bin ich",
      "Je mehr ich lese,",
    ],
    answer: "Je mehr ich lese, desto glücklicher bin ich",
    translation: "Чим більше я читаю, тим щасливішим я є."
  },
  {
    type: "order",
    instruction: "Відновіть правильний порядок частин речення",
    parts: [
      "desto besser schmeckt es",
      "Je länger die Soße kocht,",
    ],
    answer: "Je länger die Soße kocht, desto besser schmeckt es",
    translation: "Чим довше соус вариться, тим смачнішим він стає."
  },
  {
    type: "order",
    instruction: "Відновіть правильний порядок частин речення",
    parts: [
      "desto einfacher findest du es",
      "Je öfter du es wiederholst,",
    ],
    answer: "Je öfter du es wiederholst, desto einfacher findest du es",
    translation: "Чим частіше ти це повторюєш, тим легше тобі це дається."
  },

  // ── ERROR DETECTION ────────────────────────────────────────────────────────
  {
    type: "error",
    instruction: "Знайди та виправ помилку",
    wrong: "Je mehr du lernst, desto du wirst besser.",
    hint: "У desto-частині дієслово йде ПІСЛЯ Komparativ, а підмет — після дієслова",
    correct: "Je mehr du lernst, desto besser wirst du.",
    translation: "Чим більше ти вчишся, тим кращим ти стаєш.",
    options: [
      "Je mehr du lernst, desto besser wirst du.",
      "Je mehr du lernst, desto du besser wirst.",
      "Je mehr du lernst, desto wirst du besser.",
      "Je du mehr lernst, desto besser wirst du.",
    ],
    correctIdx: 0
  },
  {
    type: "error",
    instruction: "Знайди та виправ помилку",
    wrong: "Je kälter wird es, desto mehr wir heizen.",
    hint: "У je-частині дієслово йде в КІНЕЦЬ (як у Nebensatz)",
    correct: "Je kälter es wird, desto mehr heizen wir.",
    translation: "Чим холодніше стає, тим більше ми топимо.",
    options: [
      "Je kälter wird es, desto mehr heizen wir.",
      "Je kälter es wird, desto mehr heizen wir.",
      "Je es kälter wird, desto mehr wir heizen.",
      "Je kälter es ist, desto mehr heizen wir.",
    ],
    correctIdx: 1
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function Tag({ children, color }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}40`,
      borderRadius: 6, padding: "2px 9px", fontSize: 12, fontWeight: 700,
      whiteSpace: "nowrap"
    }}>{children}</span>
  );
}

function WordButton({ word, onClick, variant = "bank", disabled }) {
  const colors = {
    bank: { bg: "#12122a", fg: "#7070c0", border: "#2a2a5a", hBg: "#1e1e4a", hFg: "#a0a0e0" },
    selected: { bg: "#252550", fg: "#c0c0ff", border: "#4a4aaa", hBg: "#2e2e6a", hFg: "#d0d0ff" },
    correct: { bg: "#0d2b1a", fg: "#52d48a", border: "#2d6a4f", hBg: "#0d2b1a", hFg: "#52d48a" },
    wrong: { bg: "#2b0d0d", fg: "#d45252", border: "#6a2d2d", hBg: "#2b0d0d", hFg: "#d45252" },
  };
  const c = colors[variant];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
        borderRadius: 7, padding: "6px 12px", fontSize: 14, cursor: disabled ? "default" : "pointer",
        fontFamily: "'Georgia', serif", fontWeight: 600, transition: "background 0.15s, color 0.15s"
      }}
      onMouseEnter={e => { if (!disabled) { e.target.style.background = c.hBg; e.target.style.color = c.hFg; } }}
      onMouseLeave={e => { if (!disabled) { e.target.style.background = c.bg; e.target.style.color = c.fg; } }}
    >{word}</button>
  );
}

function ResultBadge({ status, correct }) {
  if (!status) return null;
  return status === "correct"
    ? <span style={{ color: "#52d48a", fontWeight: 700 }}>✓ Richtig!</span>
    : <span style={{ color: "#f87171", fontSize: 13 }}>
        ✗ &nbsp;<span style={{ color: "#8888aa" }}>→ </span>
        <span style={{ color: "#c0c0d0", fontStyle: "italic", fontFamily: "'Georgia', serif" }}>{correct}</span>
      </span>;
}

// ─── EXERCISE RENDERERS ───────────────────────────────────────────────────────

function BuildExercise({ ex, onDone }) {
  const [pool] = useState(() => shuffle(ex.words.map((w, i) => ({ w, id: i }))));
  const [available, setAvailable] = useState(pool);
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState(null);

  const pick = useCallback((item) => {
    if (status) return;
    setSelected(s => [...s, item]);
    setAvailable(a => a.filter(x => x.id !== item.id));
  }, [status]);

  const unpick = useCallback((item) => {
    if (status) return;
    setSelected(s => s.filter(x => x.id !== item.id));
    setAvailable(a => [...a, item]);
  }, [status]);

  const check = () => {
    const ans = selected.map(x => x.w).join(" ");
    const ok = ans === ex.answer;
    setStatus(ok ? "correct" : "wrong");
    if (ok) onDone(true);
  };

  const reset = () => { setAvailable(pool); setSelected([]); setStatus(null); };

  return (
    <div>
      <div style={{
        minHeight: 48, background: "#0d0d1a", border: "1px dashed #3a3a6a",
        borderRadius: 8, padding: "8px 12px", display: "flex", flexWrap: "wrap",
        gap: 6, marginBottom: 10, alignItems: "center"
      }}>
        {selected.length === 0 && <span style={{ color: "#3a3a5a", fontSize: 13 }}>Клікай слова нижче...</span>}
        {selected.map(item => (
          <WordButton key={item.id} word={item.w} onClick={() => unpick(item)}
            variant={status === "correct" ? "correct" : status === "wrong" ? "wrong" : "selected"}
            disabled={!!status} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {available.map(item => (
          <WordButton key={item.id} word={item.w} onClick={() => pick(item)} disabled={!!status} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {!status
          ? <button onClick={check} disabled={!selected.length} style={{
              background: selected.length ? "#3a3a9a" : "#1a1a3a",
              color: selected.length ? "#c0c0ff" : "#3a3a5a",
              border: "none", borderRadius: 7, padding: "7px 18px",
              fontSize: 13, cursor: selected.length ? "pointer" : "default", fontWeight: 700
            }}>Перевірити</button>
          : <button onClick={reset} style={{
              background: "#1a1a3a", color: "#7070c0", border: "1px solid #2a2a5a",
              borderRadius: 7, padding: "7px 16px", fontSize: 13, cursor: "pointer"
            }}>↺ Знову</button>
        }
        <ResultBadge status={status} correct={ex.answer} />
      </div>
      {status && <p style={{ color: "#5a5a8a", fontSize: 12, marginTop: 8 }}>🇺🇦 {ex.translation}</p>}
    </div>
  );
}

function FillExercise({ ex, onDone }) {
  const [chosen, setChosen] = useState(Array(ex.blanks.length).fill(null));
  const [status, setStatus] = useState(null);

  const parts = ex.template.split("___");

  const pick = (blankIdx, optIdx) => {
    if (status) return;
    setChosen(c => { const n = [...c]; n[blankIdx] = optIdx; return n; });
  };

  const check = () => {
    const ok = ex.blanks.every((b, i) => chosen[i] === b.correct);
    setStatus(ok ? "correct" : "wrong");
    if (ok) onDone(true);
  };

  const reset = () => { setChosen(Array(ex.blanks.length).fill(null)); setStatus(null); };

  return (
    <div>
      {/* Sentence preview */}
      <div style={{
        background: "#0d0d1a", borderRadius: 8, padding: "12px 16px",
        marginBottom: 14, fontSize: 15, lineHeight: 2,
        fontFamily: "'Georgia', serif", color: "#c0c0e0"
      }}>
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < ex.blanks.length && (
              <span style={{
                display: "inline-block", minWidth: 100, borderBottom: "2px solid",
                borderColor: chosen[i] !== null
                  ? (status === "correct" ? "#52d48a" : status === "wrong" && chosen[i] !== ex.blanks[i].correct ? "#f87171" : "#60a5fa")
                  : "#3a3a6a",
                padding: "0 6px", color: chosen[i] !== null ? "#e0e0ff" : "#4a4a7a",
                margin: "0 4px", textAlign: "center"
              }}>
                {chosen[i] !== null ? ex.blanks[i].options[chosen[i]] : "???"}
              </span>
            )}
          </span>
        ))}
      </div>
      {/* Options */}
      {ex.blanks.map((blank, bi) => (
        <div key={bi} style={{ marginBottom: 10 }}>
          <span style={{ color: "#5a5a8a", fontSize: 12, marginRight: 8 }}>Пропуск {bi + 1}:</span>
          <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
            {blank.options.map((opt, oi) => (
              <WordButton key={oi} word={opt} onClick={() => pick(bi, oi)}
                variant={chosen[bi] === oi ? "selected" : "bank"} disabled={!!status} />
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
        {!status
          ? <button onClick={check} disabled={chosen.includes(null)} style={{
              background: !chosen.includes(null) ? "#3a3a9a" : "#1a1a3a",
              color: !chosen.includes(null) ? "#c0c0ff" : "#3a3a5a",
              border: "none", borderRadius: 7, padding: "7px 18px", fontSize: 13,
              cursor: !chosen.includes(null) ? "pointer" : "default", fontWeight: 700
            }}>Перевірити</button>
          : <button onClick={reset} style={{
              background: "#1a1a3a", color: "#7070c0", border: "1px solid #2a2a5a",
              borderRadius: 7, padding: "7px 16px", fontSize: 13, cursor: "pointer"
            }}>↺ Знову</button>
        }
        {status === "correct" && <span style={{ color: "#52d48a", fontWeight: 700 }}>✓ Richtig!</span>}
        {status === "wrong" && <span style={{ color: "#f87171" }}>✗ Є помилка, спробуй ще</span>}
      </div>
      {status && <p style={{ color: "#5a5a8a", fontSize: 12, marginTop: 8 }}>🇺🇦 {ex.translation}</p>}
    </div>
  );
}

function OrderExercise({ ex, onDone }) {
  const [shuffled] = useState(() => shuffle(ex.parts.map((p, i) => ({ p, id: i }))));
  const [order, setOrder] = useState(shuffled);
  const [status, setStatus] = useState(null);

  const moveUp = (i) => {
    if (i === 0 || status) return;
    const n = [...order]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setOrder(n);
  };
  const moveDown = (i) => {
    if (i === order.length - 1 || status) return;
    const n = [...order]; [n[i], n[i + 1]] = [n[i + 1], n[i]]; setOrder(n);
  };

  const check = () => {
    const ans = order.map(x => x.p).join(" ");
    const ok = ans === ex.answer;
    setStatus(ok ? "correct" : "wrong");
    if (ok) onDone(true);
  };

  const reset = () => { setOrder(shuffled); setStatus(null); };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        {order.map((item, i) => (
          <div key={item.id} style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 6
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <button onClick={() => moveUp(i)} disabled={i === 0 || !!status} style={{
                background: "none", border: "none", color: i === 0 ? "#2a2a4a" : "#6060aa",
                cursor: i === 0 ? "default" : "pointer", fontSize: 12, padding: "0 4px", lineHeight: 1
              }}>▲</button>
              <button onClick={() => moveDown(i)} disabled={i === order.length - 1 || !!status} style={{
                background: "none", border: "none",
                color: i === order.length - 1 ? "#2a2a4a" : "#6060aa",
                cursor: i === order.length - 1 ? "default" : "pointer", fontSize: 12, padding: "0 4px", lineHeight: 1
              }}>▼</button>
            </div>
            <div style={{
              background: status === "correct" ? "#0d2b1a" : status === "wrong" ? "#1a0d0d" : "#1a1a3a",
              border: `1px solid ${status === "correct" ? "#2d6a4f" : status === "wrong" ? "#4a1a1a" : "#2a2a5a"}`,
              borderRadius: 8, padding: "8px 14px", flex: 1,
              color: status === "correct" ? "#52d48a" : status === "wrong" ? "#f87171" : "#a0a0d0",
              fontFamily: "'Georgia', serif", fontSize: 14, fontStyle: "italic"
            }}>
              <span style={{ color: "#4a4a7a", fontSize: 12, marginRight: 8 }}>{i + 1}.</span>
              {item.p}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {!status
          ? <button onClick={check} style={{
              background: "#3a3a9a", color: "#c0c0ff", border: "none",
              borderRadius: 7, padding: "7px 18px", fontSize: 13, cursor: "pointer", fontWeight: 700
            }}>Перевірити</button>
          : <button onClick={reset} style={{
              background: "#1a1a3a", color: "#7070c0", border: "1px solid #2a2a5a",
              borderRadius: 7, padding: "7px 16px", fontSize: 13, cursor: "pointer"
            }}>↺ Знову</button>
        }
        <ResultBadge status={status} correct={ex.answer} />
      </div>
      {status && <p style={{ color: "#5a5a8a", fontSize: 12, marginTop: 8 }}>🇺🇦 {ex.translation}</p>}
    </div>
  );
}

function ErrorExercise({ ex, onDone }) {
  const [chosen, setChosen] = useState(null);
  const [status, setStatus] = useState(null);

  const pick = (idx) => {
    if (status) return;
    setChosen(idx);
    const ok = idx === ex.correctIdx;
    setStatus(ok ? "correct" : "wrong");
    if (ok) onDone(true);
  };

  const reset = () => { setChosen(null); setStatus(null); };

  return (
    <div>
      <div style={{
        background: "#1a0d0d", border: "1px solid #4a1a1a",
        borderRadius: 8, padding: "10px 14px", marginBottom: 12
      }}>
        <span style={{ color: "#f87171", fontSize: 12, fontWeight: 700 }}>❌ Помилкове речення:</span>
        <p style={{ color: "#c08080", fontFamily: "'Georgia', serif", fontStyle: "italic", margin: "4px 0 0" }}>{ex.wrong}</p>
      </div>
      <p style={{ color: "#6060a0", fontSize: 13, marginBottom: 10 }}>💡 {ex.hint}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ex.options.map((opt, idx) => {
          let variant = "bank";
          if (chosen !== null) {
            if (idx === ex.correctIdx) variant = "correct";
            else if (idx === chosen) variant = "wrong";
          }
          return (
            <button key={idx} onClick={() => pick(idx)} disabled={!!status} style={{
              background: variant === "correct" ? "#0d2b1a" : variant === "wrong" ? "#2b0d0d" : "#12122a",
              color: variant === "correct" ? "#52d48a" : variant === "wrong" ? "#f87171" : "#8080c0",
              border: `1px solid ${variant === "correct" ? "#2d6a4f" : variant === "wrong" ? "#6a2d2d" : "#2a2a5a"}`,
              borderRadius: 8, padding: "10px 16px", textAlign: "left",
              fontFamily: "'Georgia', serif", fontStyle: "italic", fontSize: 14,
              cursor: status ? "default" : "pointer", transition: "all 0.2s"
            }}>{opt}</button>
          );
        })}
      </div>
      {status && (
        <div style={{ marginTop: 10 }}>
          {status === "correct"
            ? <span style={{ color: "#52d48a", fontWeight: 700 }}>✓ Richtig!</span>
            : <span style={{ color: "#f87171" }}>✗ Правильна відповідь виділена зеленим</span>
          }
          <p style={{ color: "#5a5a8a", fontSize: 12, marginTop: 6 }}>🇺🇦 {ex.translation}</p>
          <button onClick={reset} style={{
            background: "#1a1a3a", color: "#7070c0", border: "1px solid #2a2a5a",
            borderRadius: 7, padding: "6px 14px", fontSize: 13, cursor: "pointer", marginTop: 4
          }}>↺ Знову</button>
        </div>
      )}
    </div>
  );
}

// ─── RULE PANEL ───────────────────────────────────────────────────────────────

function RulePanel() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 24 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", background: "#0f0f28", border: "1px solid #3a3a7a",
        borderRadius: 12, padding: "14px 18px", cursor: "pointer", textAlign: "left",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <span style={{ color: "#a78bfa", fontWeight: 800, fontSize: 15 }}>📐 Правило Je…desto</span>
          <span style={{ color: "#4a4a7a", fontSize: 12, marginLeft: 10 }}>Структура + приклади</span>
        </div>
        <span style={{ color: "#4a4a8a", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>
      {open && (
        <div style={{ background: "#0d0d20", border: "1px solid #2a2a5a", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "18px 20px" }}>
          {/* Structure */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 16 }}>
            {RULE.structure.map((s, i) => (
              <span key={i}>
                <Tag color={s.color}>{s.part}</Tag>
                {i < RULE.structure.length - 1 && i !== 2 && (
                  <span style={{ color: "#3a3a5a", margin: "0 4px", fontSize: 12 }}>·</span>
                )}
                {i === 2 && <span style={{ color: "#f59e0b", margin: "0 8px", fontWeight: 800 }}>,</span>}
              </span>
            ))}
          </div>

          {/* Key rules */}
          <div style={{ marginBottom: 14 }}>
            {[
              { icon: "⚠️", text: "У Je-частині дієслово йде В КІНЕЦЬ (як у Nebensatz): Je mehr du lernst,..." },
              { icon: "⚠️", text: "У Desto-частині: desto + Komparativ + ДІЄСЛОВО + підмет (інверсія!)" },
              { icon: "✅", text: "Обидві частини вимагають порівняльного ступеня (Komparativ)" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <span>{r.icon}</span>
                <span style={{ color: "#8888cc", fontSize: 13, lineHeight: 1.5 }}>{r.text}</span>
              </div>
            ))}
          </div>

          {/* Examples */}
          {RULE.examples.map((ex, i) => (
            <div key={i} style={{ background: "#12122a", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
              <p style={{ margin: 0, fontFamily: "'Georgia', serif", fontStyle: "italic", fontSize: 14 }}>
                <span style={{ color: "#a78bfa" }}>{ex.je}</span>{" "}
                <span style={{ color: "#f59e0b" }}>{ex.desto}</span>
              </p>
              <p style={{ margin: "4px 0 0", color: "#5a5a8a", fontSize: 12 }}>🇺🇦 {ex.ua}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  build: { label: "Склади речення", icon: "🔧" },
  fill: { label: "Заповни пропуски", icon: "✏️" },
  order: { label: "Розстав частини", icon: "↕️" },
  error: { label: "Знайди помилку", icon: "🔍" },
};

export default function App() {
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState({});
  const [showAll, setShowAll] = useState(false);

  const handleDone = useCallback((ok) => {
    setScores(s => ({ ...s, [current]: ok }));
  }, [current]);

  const total = EXERCISES.length;
  const done = Object.keys(scores).length;
  const correct = Object.values(scores).filter(Boolean).length;

  const ex = EXERCISES[current];
  const typeInfo = TYPE_LABELS[ex.type];

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a18",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "24px 16px", maxWidth: 660, margin: "0 auto"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#4a4a8a", textTransform: "uppercase", marginBottom: 6 }}>
          Вправи на порядок слів
        </div>
        <h1 style={{
          fontSize: 28, fontWeight: 900, margin: 0, fontFamily: "'Georgia', serif",
          background: "linear-gradient(135deg, #a78bfa 0%, #f59e0b 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>Je … desto</h1>
        <p style={{ color: "#4a4a8a", fontSize: 13, margin: "6px 0 0" }}>
          Чим більше тренуєшся, тим краще говориш 😉
        </p>
      </div>

      <RulePanel />

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 4, background: "#1a1a3a", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4,
            background: "linear-gradient(90deg, #a78bfa, #f59e0b)",
            width: `${(done / total) * 100}%`, transition: "width 0.4s"
          }} />
        </div>
        <span style={{ color: "#6060a0", fontSize: 12, whiteSpace: "nowrap" }}>
          {correct}/{total} ✓
        </span>
      </div>

      {/* Exercise navigator */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {EXERCISES.map((e, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            width: 32, height: 32, borderRadius: 8,
            background: i === current ? "#3a3a9a"
              : scores[i] === true ? "#0d2b1a"
              : scores[i] === false ? "#2b0d0d" : "#12122a",
            border: `1px solid ${i === current ? "#6060cc" : scores[i] === true ? "#2d6a4f" : scores[i] === false ? "#6a2d2d" : "#2a2a4a"}`,
            color: i === current ? "#e0e0ff" : scores[i] === true ? "#52d48a" : scores[i] === false ? "#f87171" : "#4a4a7a",
            fontSize: 11, fontWeight: 700, cursor: "pointer"
          }}>
            {scores[i] === true ? "✓" : scores[i] === false ? "✗" : i + 1}
          </button>
        ))}
      </div>

      {/* Current exercise */}
      <div style={{ background: "#13132a", border: "1px solid #22224a", borderRadius: 16, padding: "20px 20px 22px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>{typeInfo.icon}</span>
          <span style={{ color: "#8080c0", fontSize: 13, fontWeight: 600 }}>{typeInfo.label}</span>
          <span style={{ marginLeft: "auto", color: "#3a3a6a", fontSize: 12 }}>#{current + 1}/{total}</span>
        </div>
        <p style={{ color: "#a0a0d0", fontSize: 14, marginBottom: 14, marginTop: 0 }}>{ex.instruction}</p>

        {ex.type === "build" && <BuildExercise key={current} ex={ex} onDone={handleDone} />}
        {ex.type === "fill" && <FillExercise key={current} ex={ex} onDone={handleDone} />}
        {ex.type === "order" && <OrderExercise key={current} ex={ex} onDone={handleDone} />}
        {ex.type === "error" && <ErrorExercise key={current} ex={ex} onDone={handleDone} />}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} style={{
          background: current === 0 ? "#0d0d1a" : "#1a1a3a",
          color: current === 0 ? "#2a2a4a" : "#7070c0",
          border: "1px solid #2a2a4a", borderRadius: 8, padding: "8px 18px",
          fontSize: 13, cursor: current === 0 ? "default" : "pointer"
        }}>← Назад</button>
        <button onClick={() => setCurrent(c => Math.min(total - 1, c + 1))} disabled={current === total - 1} style={{
          background: current === total - 1 ? "#0d0d1a" : "#3a3a9a",
          color: current === total - 1 ? "#2a2a4a" : "#c0c0ff",
          border: "none", borderRadius: 8, padding: "8px 18px",
          fontSize: 13, cursor: current === total - 1 ? "default" : "pointer", fontWeight: 700
        }}>Далі →</button>
      </div>

      {done === total && (
        <div style={{
          marginTop: 20, background: "#0d2b1a", border: "1px solid #2d6a4f",
          borderRadius: 12, padding: "16px 20px", textAlign: "center"
        }}>
          <p style={{ color: "#52d48a", fontWeight: 800, fontSize: 16, margin: 0 }}>
            🎉 Alle Aufgaben erledigt! {correct}/{total} правильно
          </p>
          {correct === total && <p style={{ color: "#34d399", fontSize: 13, margin: "6px 0 0" }}>Ausgezeichnet! 🏆</p>}
        </div>
      )}
    </div>
  );
}
