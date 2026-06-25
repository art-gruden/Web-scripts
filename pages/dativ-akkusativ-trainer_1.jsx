import { useState, useCallback } from "react";

// ─── COLORS ──────────────────────────────────────────────────────────────────
const DAT = "#60a5fa";   // Dativ — blue
const AKK = "#f59e0b";   // Akkusativ — orange

// ─── DATA ────────────────────────────────────────────────────────────────────

// Rule 1: Nomen + Nomen → Dativ vor Akkusativ
const NOMEN_NOMEN = [
  { words: ["Ich", "schenke", "meiner Schwester", "ein Buch"], answer: "Ich schenke meiner Schwester ein Buch", dat: "meiner Schwester", akk: "ein Buch", translation: "Я дарую сестрі книгу." },
  { words: ["Er", "zeigt", "den Touristen", "die Stadt"], answer: "Er zeigt den Touristen die Stadt", dat: "den Touristen", akk: "die Stadt", translation: "Він показує туристам місто." },
  { words: ["Wir", "erklären", "den Schülern", "die Aufgabe"], answer: "Wir erklären den Schülern die Aufgabe", dat: "den Schülern", akk: "die Aufgabe", translation: "Ми пояснюємо учням завдання." },
  { words: ["Sie", "kauft", "ihrem Sohn", "ein Fahrrad"], answer: "Sie kauft ihrem Sohn ein Fahrrad", dat: "ihrem Sohn", akk: "ein Fahrrad", translation: "Вона купує синові велосипед." },
  { words: ["Der Lehrer", "leiht", "dem Studenten", "das Buch"], answer: "Der Lehrer leiht dem Studenten das Buch", dat: "dem Studenten", akk: "das Buch", translation: "Викладач позичає студенту книгу." },
];

// Rule 2: Nomen + Pronomen → das Pronomen kommt vor dem Nomen (egal welcher Kasus)
const NOMEN_PRONOMEN = [
  {
    base: "Ich schenke meiner Schwester ein Buch.",
    replace: "ein Buch → es",
    options: ["Ich schenke es meiner Schwester.", "Ich schenke meiner Schwester es.", "Es schenke ich meiner Schwester.", "Ich es schenke meiner Schwester."],
    correctIdx: 0,
    translation: "Я дарую її (книгу) сестрі."
  },
  {
    base: "Er zeigt den Touristen die Stadt.",
    replace: "den Touristen → ihnen",
    options: ["Er zeigt die Stadt ihnen.", "Er zeigt ihnen die Stadt.", "Ihnen zeigt die Stadt er.", "Er ihnen zeigt die Stadt."],
    correctIdx: 1,
    translation: "Він показує їм місто."
  },
  {
    base: "Wir erklären den Schülern die Aufgabe.",
    replace: "die Aufgabe → sie",
    options: ["Wir erklären den Schülern sie.", "Wir erklären sie den Schülern.", "Sie erklären wir den Schülern.", "Wir den Schülern erklären sie."],
    correctIdx: 1,
    translation: "Ми пояснюємо її (завдання) учням."
  },
  {
    base: "Sie kauft ihrem Sohn ein Fahrrad.",
    replace: "ihrem Sohn → ihm",
    options: ["Sie kauft ein Fahrrad ihm.", "Sie ihm kauft ein Fahrrad.", "Sie kauft ihm ein Fahrrad.", "Ihm kauft ein Fahrrad sie."],
    correctIdx: 2,
    translation: "Вона купує йому велосипед."
  },
];

// Rule 3: Pronomen + Pronomen → Akkusativ vor Dativ
const PRONOMEN_PRONOMEN = [
  { words: ["Ich", "schenke", "es", "ihr"], answer: "Ich schenke es ihr", translation: "Я дарую їй це (книгу)." },
  { words: ["Er", "zeigt", "sie", "ihnen"], answer: "Er zeigt sie ihnen", translation: "Він показує їм його (місто)." },
  { words: ["Wir", "erklären", "sie", "ihnen"], answer: "Wir erklären sie ihnen", translation: "Ми пояснюємо їм її (завдання)." },
  { words: ["Sie", "kauft", "es", "ihm"], answer: "Sie kauft es ihm", translation: "Вона купує йому це (велосипед)." },
];

// Error detection across all 3 rules
const ERRORS = [
  {
    wrong: "Ich schenke meiner Schwester es.",
    hint: "Якщо один об'єкт — займенник, він йде ПЕРЕД іменником (незалежно від відмінка)",
    options: ["Ich schenke es meiner Schwester.", "Ich schenke meiner Schwester es.", "Es ich schenke meiner Schwester.", "Ich schenke ihr es."],
    correctIdx: 0,
    translation: "Я дарую це сестрі."
  },
  {
    wrong: "Ich schenke ihr es.",
    hint: "Коли ОБИДВА об'єкти — займенники: Akkusativ стоїть перед Dativ",
    options: ["Ich schenke es ihr.", "Ich schenke ihr es.", "Es schenke ich ihr.", "Ihr schenke ich es."],
    correctIdx: 0,
    translation: "Я дарую їй це."
  },
  {
    wrong: "Er zeigt die Stadt ihnen.",
    hint: "Займенник (ihnen) повинен стояти перед іменником (die Stadt)",
    options: ["Er zeigt ihnen die Stadt.", "Er zeigt die Stadt ihnen.", "Ihnen zeigt er die Stadt.", "Er die Stadt zeigt ihnen."],
    correctIdx: 0,
    translation: "Він показує їм місто."
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

// ─── SHARED UI ────────────────────────────────────────────────────────────────

function WordChip({ word, onClick, variant = "bank", disabled }) {
  const variants = {
    bank: { bg: "#12122a", fg: "#7070c0", border: "#2a2a5a" },
    selected: { bg: "#252550", fg: "#c0c0ff", border: "#4a4aaa" },
    correct: { bg: "#0d2b1a", fg: "#52d48a", border: "#2d6a4f" },
    wrong: { bg: "#2b0d0d", fg: "#d45252", border: "#6a2d2d" },
  };
  const c = variants[variant];
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
      borderRadius: 7, padding: "6px 12px", fontSize: 14, cursor: disabled ? "default" : "pointer",
      fontFamily: "'Georgia', serif", fontWeight: 600
    }}>{word}</button>
  );
}

function ResultLine({ status, correctText }) {
  if (!status) return null;
  return status === "correct"
    ? <span style={{ color: "#52d48a", fontWeight: 700 }}>✓ Richtig!</span>
    : <span style={{ color: "#f87171", fontSize: 13 }}>
        ✗ &nbsp;<span style={{ color: "#8888aa" }}>→ </span>
        <span style={{ color: "#c0c0d0", fontStyle: "italic", fontFamily: "'Georgia', serif" }}>{correctText}</span>
      </span>;
}

function Tag({ children, color }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}40`,
      borderRadius: 6, padding: "2px 9px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap"
    }}>{children}</span>
  );
}

// ─── EXERCISE A: NOMEN + NOMEN (build) ────────────────────────────────────────

function BuildExercise({ ex, onDone, showCases }) {
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
      {showCases && (
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <Tag color={DAT}>Dativ: {ex.dat}</Tag>
          <Tag color={AKK}>Akkusativ: {ex.akk}</Tag>
        </div>
      )}
      <div style={{
        minHeight: 48, background: "#0d0d1a", border: "1px dashed #3a3a6a",
        borderRadius: 8, padding: "8px 12px", display: "flex", flexWrap: "wrap",
        gap: 6, marginBottom: 10, alignItems: "center"
      }}>
        {selected.length === 0 && <span style={{ color: "#3a3a5a", fontSize: 13 }}>Клікай частини нижче...</span>}
        {selected.map(item => (
          <WordChip key={item.id} word={item.w} onClick={() => unpick(item)}
            variant={status === "correct" ? "correct" : status === "wrong" ? "wrong" : "selected"}
            disabled={!!status} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {available.map(item => (
          <WordChip key={item.id} word={item.w} onClick={() => pick(item)} disabled={!!status} />
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
        <ResultLine status={status} correctText={ex.answer + "."} />
      </div>
      {status && <p style={{ color: "#5a5a8a", fontSize: 12, marginTop: 8 }}>🇺🇦 {ex.translation}</p>}
    </div>
  );
}

// ─── EXERCISE B: NOMEN + PRONOMEN (multiple choice) ───────────────────────────

function ChoiceExercise({ ex, onDone }) {
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
      <div style={{ background: "#0d0d20", border: "1px solid #2a2a5a", borderRadius: 8, padding: "10px 14px", marginBottom: 10 }}>
        <span style={{ color: "#6a6a9a", fontSize: 12 }}>Базове речення:</span>
        <p style={{ color: "#c0c0e0", fontFamily: "'Georgia', serif", fontStyle: "italic", margin: "4px 0 0" }}>{ex.base}</p>
      </div>
      <p style={{ color: "#a78bfa", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🔄 Замінити: {ex.replace}</p>
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
              cursor: status ? "default" : "pointer"
            }}>{opt}</button>
          );
        })}
      </div>
      {status && (
        <div style={{ marginTop: 10 }}>
          {status === "correct"
            ? <span style={{ color: "#52d48a", fontWeight: 700 }}>✓ Richtig!</span>
            : <span style={{ color: "#f87171" }}>✗ Правильна відповідь виділена зеленим</span>}
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

// ─── EXERCISE D: FEHLER FINDEN ─────────────────────────────────────────────────

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
      <div style={{ background: "#1a0d0d", border: "1px solid #4a1a1a", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
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
              cursor: status ? "default" : "pointer"
            }}>{opt}</button>
          );
        })}
      </div>
      {status && (
        <div style={{ marginTop: 10 }}>
          {status === "correct"
            ? <span style={{ color: "#52d48a", fontWeight: 700 }}>✓ Richtig!</span>
            : <span style={{ color: "#f87171" }}>✗ Правильна відповідь виділена зеленим</span>}
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
          <span style={{ color: "#a78bfa", fontWeight: 800, fontSize: 15 }}>📐 Dativ vs. Akkusativ</span>
          <span style={{ color: "#4a4a7a", fontSize: 12, marginLeft: 10 }}>Nomen / Pronomen — порядок об'єктів</span>
        </div>
        <span style={{ color: "#4a4a8a", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>
      {open && (
        <div style={{ background: "#0d0d20", border: "1px solid #2a2a5a", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "18px 20px" }}>

          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "#e0e0ff", fontWeight: 700, fontSize: 13, margin: "0 0 6px" }}>1️⃣ Nomen + Nomen → <Tag color={DAT}>Dativ</Tag> vor <Tag color={AKK}>Akkusativ</Tag></p>
            <p style={{ color: "#c0c0e0", fontFamily: "'Georgia', serif", fontStyle: "italic", fontSize: 14, margin: "0 0 4px" }}>
              Ich schenke <span style={{ color: DAT }}>meiner Schwester</span> <span style={{ color: AKK }}>ein Buch</span>.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "#e0e0ff", fontWeight: 700, fontSize: 13, margin: "0 0 6px" }}>2️⃣ Nomen + Pronomen → Pronomen завжди перед Nomen</p>
            <p style={{ color: "#c0c0e0", fontFamily: "'Georgia', serif", fontStyle: "italic", fontSize: 14, margin: "0 0 4px" }}>
              Ich schenke <span style={{ color: AKK }}>es</span> <span style={{ color: DAT }}>meiner Schwester</span>.
            </p>
            <p style={{ color: "#c0c0e0", fontFamily: "'Georgia', serif", fontStyle: "italic", fontSize: 14, margin: 0 }}>
              Er zeigt <span style={{ color: DAT }}>ihnen</span> <span style={{ color: AKK }}>die Stadt</span>.
            </p>
            <p style={{ color: "#6a6a9a", fontSize: 12, marginTop: 6 }}>Не важливо, чи це Dativ-, чи Akkusativ-займенник — він завжди йде перед іменником.</p>
          </div>

          <div>
            <p style={{ color: "#e0e0ff", fontWeight: 700, fontSize: 13, margin: "0 0 6px" }}>3️⃣ Pronomen + Pronomen → <Tag color={AKK}>Akkusativ</Tag> vor <Tag color={DAT}>Dativ</Tag></p>
            <p style={{ color: "#c0c0e0", fontFamily: "'Georgia', serif", fontStyle: "italic", fontSize: 14, margin: 0 }}>
              Ich schenke <span style={{ color: AKK }}>es</span> <span style={{ color: DAT }}>ihr</span>.
            </p>
            <p style={{ color: "#6a6a9a", fontSize: 12, marginTop: 6 }}>Тут порядок протилежний правилу №1 — Akkusativ виходить наперед!</p>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const STAGES = [
  { id: "nn", icon: "📘", label: "Nomen + Nomen", desc: "Dativ vor Akkusativ — склади речення" },
  { id: "np", icon: "🔄", label: "Nomen + Pronomen", desc: "Замінюй іменник на займенник і обирай правильний порядок" },
  { id: "pp", icon: "🔁", label: "Pronomen + Pronomen", desc: "Akkusativ vor Dativ — склади речення" },
  { id: "err", icon: "🔍", label: "Знайди помилку", desc: "Обери речення з правильним порядком" },
];

export default function App() {
  const [stage, setStage] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [scores, setScores] = useState({});

  const stageId = STAGES[stage].id;
  const lists = { nn: NOMEN_NOMEN, np: NOMEN_PRONOMEN, pp: PRONOMEN_PRONOMEN, err: ERRORS };
  const currentList = lists[stageId];

  const handleDone = useCallback((key, ok) => {
    setScores(s => ({ ...s, [key]: ok }));
  }, []);

  const goStage = (i) => { setStage(i); setSubIndex(0); };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a18",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "24px 16px", maxWidth: 660, margin: "0 auto"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#4a4a8a", textTransform: "uppercase", marginBottom: 6 }}>
          wem? · wen?
        </div>
        <h1 style={{
          fontSize: 27, fontWeight: 900, margin: 0, fontFamily: "'Georgia', serif",
          background: `linear-gradient(135deg, ${DAT} 0%, ${AKK} 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>Dativ &amp; Akkusativ</h1>
        <p style={{ color: "#4a4a8a", fontSize: 13, margin: "6px 0 0" }}>
          Reihenfolge: Nomen / Pronomen
        </p>
      </div>

      <RulePanel />

      {/* Stage tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {STAGES.map((s, i) => (
          <button key={s.id} onClick={() => goStage(i)} style={{
            flex: "1 1 auto", minWidth: 76,
            background: stage === i ? "#3a3a9a" : "#12122a",
            border: `1px solid ${stage === i ? "#6060cc" : "#22224a"}`,
            borderRadius: 9, padding: "8px 6px", cursor: "pointer", textAlign: "center"
          }}>
            <div style={{ fontSize: 16 }}>{s.icon}</div>
            <div style={{ fontSize: 10.5, color: stage === i ? "#e0e0ff" : "#6a6a9a", fontWeight: 700, marginTop: 2, lineHeight: 1.2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Stage content */}
      <div style={{ background: "#13132a", border: "1px solid #22224a", borderRadius: 16, padding: "20px 20px 22px", marginBottom: 16 }}>
        <p style={{ color: "#a0a0d0", fontSize: 14, marginTop: 0, marginBottom: 16 }}>{STAGES[stage].desc}</p>

        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {currentList.map((_, i) => (
            <button key={i} onClick={() => setSubIndex(i)} style={{
              width: 30, height: 30, borderRadius: 7,
              background: i === subIndex ? "#3a3a9a"
                : scores[`${stageId}-${i}`] === true ? "#0d2b1a"
                : scores[`${stageId}-${i}`] === false ? "#2b0d0d" : "#12122a",
              border: `1px solid ${i === subIndex ? "#6060cc" : "#2a2a4a"}`,
              color: i === subIndex ? "#e0e0ff" : scores[`${stageId}-${i}`] === true ? "#52d48a" : "#6a6a9a",
              fontSize: 11, fontWeight: 700, cursor: "pointer"
            }}>{scores[`${stageId}-${i}`] === true ? "✓" : i + 1}</button>
          ))}
        </div>

        {stageId === "nn" && (
          <BuildExercise key={subIndex} ex={currentList[subIndex]} showCases onDone={(ok) => handleDone(`nn-${subIndex}`, ok)} />
        )}
        {stageId === "np" && (
          <ChoiceExercise key={subIndex} ex={currentList[subIndex]} onDone={(ok) => handleDone(`np-${subIndex}`, ok)} />
        )}
        {stageId === "pp" && (
          <BuildExercise key={subIndex} ex={currentList[subIndex]} onDone={(ok) => handleDone(`pp-${subIndex}`, ok)} />
        )}
        {stageId === "err" && (
          <ErrorExercise key={subIndex} ex={currentList[subIndex]} onDone={(ok) => handleDone(`err-${subIndex}`, ok)} />
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button onClick={() => setSubIndex(c => Math.max(0, c - 1))} disabled={subIndex === 0} style={{
            background: subIndex === 0 ? "#0d0d1a" : "#1a1a3a",
            color: subIndex === 0 ? "#2a2a4a" : "#7070c0",
            border: "1px solid #2a2a4a", borderRadius: 8, padding: "7px 16px",
            fontSize: 13, cursor: subIndex === 0 ? "default" : "pointer"
          }}>← Назад</button>
          <button onClick={() => setSubIndex(c => Math.min(currentList.length - 1, c + 1))} disabled={subIndex === currentList.length - 1} style={{
            background: subIndex === currentList.length - 1 ? "#0d0d1a" : "#3a3a9a",
            color: subIndex === currentList.length - 1 ? "#2a2a4a" : "#c0c0ff",
            border: "none", borderRadius: 8, padding: "7px 16px",
            fontSize: 13, cursor: subIndex === currentList.length - 1 ? "default" : "pointer", fontWeight: 700
          }}>Далі →</button>
        </div>
      </div>

      <p style={{ textAlign: "center", color: "#2a2a4a", fontSize: 12 }}>
        Перемикай вкладки нагорі, щоб тренувати кожне правило окремо
      </p>
    </div>
  );
}
