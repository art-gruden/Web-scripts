import { useState, useCallback } from "react";

const RULES = [
  {
    id: "v2",
    title: "Правило V2",
    subtitle: "Глагол всегда на 2-м месте",
    explanation: "В главном предложении спрягаемый глагол всегда занимает вторую позицию, независимо от того, что стоит на первом месте.",
    example: { wrong: "Heute ich gehe ins Kino.", right: "Heute gehe ich ins Kino." },
    exercises: [
      { words: ["Morgen", "ich", "arbeite", "von", "zu", "Hause"], answer: "Morgen arbeite ich von zu Hause" },
      { words: ["Jeden", "Tag", "sie", "trinkt", "Kaffee"], answer: "Jeden Tag trinkt sie Kaffee" },
      { words: ["Im", "Sommer", "wir", "fahren", "ans", "Meer"], answer: "Im Sommer fahren wir ans Meer" },
      { words: ["Normalerweise", "er", "schläft", "früh"], answer: "Normalerweise schläft er früh" },
    ]
  },
  {
    id: "modal",
    title: "Модальные глаголы",
    subtitle: "Модальный на V2, инфинитив в конец",
    explanation: "С модальными глаголами (möchten, können, müssen, wollen, sollen, dürfen) смысловой глагол уходит в конец предложения в форме инфинитива.",
    example: { wrong: "Ich möchte helfen dir.", right: "Ich möchte dir helfen." },
    exercises: [
      { words: ["Ich", "möchte", "dir", "helfen"], answer: "Ich möchte dir helfen" },
      { words: ["Er", "muss", "heute", "früh", "aufstehen"], answer: "Er muss heute früh aufstehen" },
      { words: ["Wir", "können", "das", "Problem", "lösen"], answer: "Wir können das Problem lösen" },
      { words: ["Sie", "will", "nächstes", "Jahr", "Deutsch", "lernen"], answer: "Sie will nächstes Jahr Deutsch lernen" },
      { words: ["Du", "sollst", "die", "Aufgabe", "nicht", "vergessen"], answer: "Du sollst die Aufgabe nicht vergessen" },
    ]
  },
  {
    id: "trennbar",
    title: "Отделяемые приставки",
    subtitle: "Приставка уходит в конец",
    explanation: "У отделяемых глаголов (anrufen, aufstehen, einkaufen...) приставка отделяется и уходит в самый конец предложения.",
    example: { wrong: "Ich anrufe dich morgen.", right: "Ich rufe dich morgen an." },
    exercises: [
      { words: ["Ich", "rufe", "dich", "morgen", "an"], answer: "Ich rufe dich morgen an" },
      { words: ["Er", "steht", "jeden", "Morgen", "um", "7", "Uhr", "auf"], answer: "Er steht jeden Morgen um 7 Uhr auf" },
      { words: ["Wir", "kaufen", "heute", "Abend", "ein"], answer: "Wir kaufen heute Abend ein" },
      { words: ["Sie", "hört", "beim", "Joggen", "Musik", "zu"], answer: "Sie hört beim Joggen Musik zu" },
    ]
  },
  {
    id: "perfekt",
    title: "Перфект (Perfekt)",
    subtitle: "haben/sein на V2, Partizip II в конец",
    explanation: "В Perfekt вспомогательный глагол haben или sein стоит на 2-й позиции, а Partizip II уходит в конец предложения.",
    example: { wrong: "Ich habe gegessen schon.", right: "Ich habe schon gegessen." },
    exercises: [
      { words: ["Ich", "habe", "gestern", "das", "Buch", "gelesen"], answer: "Ich habe gestern das Buch gelesen" },
      { words: ["Er", "ist", "letztes", "Jahr", "nach", "Berlin", "gezogen"], answer: "Er ist letztes Jahr nach Berlin gezogen" },
      { words: ["Wir", "haben", "das", "Meeting", "gut", "vorbereitet"], answer: "Wir haben das Meeting gut vorbereitet" },
      { words: ["Sie", "hat", "die", "E-Mail", "noch", "nicht", "geschickt"], answer: "Sie hat die E-Mail noch nicht geschickt" },
    ]
  },
  {
    id: "nebensatz",
    title: "Придаточные предложения",
    subtitle: "В Nebensatz глагол в самом конце",
    explanation: "После союзов dass, weil, wenn, obwohl, damit... спрягаемый глагол уходит в самый конец придаточного предложения.",
    example: { wrong: "Ich denke, dass er kommt morgen.", right: "Ich denke, dass er morgen kommt." },
    exercises: [
      { words: ["Ich", "weiß,", "dass", "er", "morgen", "kommt"], answer: "Ich weiß, dass er morgen kommt" },
      { words: ["Er", "bleibt", "zu", "Hause,", "weil", "er", "krank", "ist"], answer: "Er bleibt zu Hause, weil er krank ist" },
      { words: ["Sie", "sagt,", "dass", "sie", "das", "Projekt", "abgeschlossen", "hat"], answer: "Sie sagt, dass sie das Projekt abgeschlossen hat" },
      { words: ["Ich", "freue", "mich,", "wenn", "du", "kommst"], answer: "Ich freue mich, wenn du kommst" },
    ]
  }
];

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function ExerciseCard({ exercise, onResult }) {
  const [shuffled] = useState(() => shuffle(exercise.words));
  const [selected, setSelected] = useState([]);
  const [available, setAvailable] = useState(shuffled);
  const [status, setStatus] = useState(null); // null | 'correct' | 'wrong'

  const addWord = useCallback((word, idx) => {
    if (status) return;
    setSelected(s => [...s, word]);
    setAvailable(a => a.filter((_, i) => i !== idx));
  }, [status]);

  const removeWord = useCallback((word, idx) => {
    if (status) return;
    setSelected(s => s.filter((_, i) => i !== idx));
    setAvailable(a => [...a, word]);
  }, [status]);

  const check = () => {
    const answer = selected.join(" ");
    const correct = answer === exercise.answer;
    setStatus(correct ? "correct" : "wrong");
    onResult(correct);
  };

  const reset = () => {
    setSelected([]);
    setAvailable(shuffled);
    setStatus(null);
  };

  return (
    <div style={{
      background: status === "correct" ? "#0d2b1a" : status === "wrong" ? "#2b0d0d" : "#1a1a2e",
      border: `1px solid ${status === "correct" ? "#2d6a4f" : status === "wrong" ? "#6a2d2d" : "#2a2a4a"}`,
      borderRadius: 12,
      padding: "16px 20px",
      marginBottom: 14,
      transition: "background 0.3s, border-color 0.3s"
    }}>
      {/* Drop zone */}
      <div style={{
        minHeight: 44,
        background: "#0d0d1a",
        borderRadius: 8,
        padding: "8px 10px",
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 10,
        border: "1px dashed #3a3a6a"
      }}>
        {selected.length === 0 && (
          <span style={{ color: "#4a4a7a", fontSize: 13, alignSelf: "center" }}>
            Нажимай слова снизу, чтобы составить предложение...
          </span>
        )}
        {selected.map((w, i) => (
          <button key={i} onClick={() => removeWord(w, i)} style={{
            background: status === "correct" ? "#1a4a30" : status === "wrong" ? "#4a1a1a" : "#252550",
            color: status === "correct" ? "#52d48a" : status === "wrong" ? "#d45252" : "#a0a0e0",
            border: "none",
            borderRadius: 6,
            padding: "5px 10px",
            fontSize: 14,
            cursor: status ? "default" : "pointer",
            fontFamily: "'Georgia', serif",
            fontWeight: 600,
            letterSpacing: "0.01em"
          }}>{w}</button>
        ))}
      </div>

      {/* Word bank */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {available.map((w, i) => (
          <button key={i} onClick={() => addWord(w, i)} style={{
            background: "#12122a",
            color: "#7070c0",
            border: "1px solid #2a2a5a",
            borderRadius: 6,
            padding: "5px 10px",
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "'Georgia', serif",
            transition: "background 0.15s, color 0.15s"
          }}
            onMouseEnter={e => { e.target.style.background = "#1e1e4a"; e.target.style.color = "#9090e0"; }}
            onMouseLeave={e => { e.target.style.background = "#12122a"; e.target.style.color = "#7070c0"; }}
          >{w}</button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {!status ? (
          <button onClick={check} disabled={selected.length === 0} style={{
            background: selected.length > 0 ? "#3a3a9a" : "#1a1a3a",
            color: selected.length > 0 ? "#c0c0ff" : "#4a4a6a",
            border: "none", borderRadius: 7, padding: "7px 18px",
            fontSize: 13, cursor: selected.length > 0 ? "pointer" : "default",
            fontWeight: 600, letterSpacing: "0.03em"
          }}>Проверить</button>
        ) : (
          <button onClick={reset} style={{
            background: "#1e1e3e", color: "#8080c0",
            border: "1px solid #3a3a6a", borderRadius: 7, padding: "7px 18px",
            fontSize: 13, cursor: "pointer", fontWeight: 600
          }}>Попробовать снова</button>
        )}
        {status === "correct" && <span style={{ color: "#52d48a", fontSize: 13, fontWeight: 700 }}>✓ Richtig!</span>}
        {status === "wrong" && (
          <span style={{ color: "#d45252", fontSize: 13 }}>
            ✗ &nbsp;
            <span style={{ color: "#8888aa" }}>→ </span>
            <span style={{ color: "#c0c0d0", fontFamily: "'Georgia', serif", fontStyle: "italic" }}>{exercise.answer}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function RuleSection({ rule }) {
  const [scores, setScores] = useState({});
  const [expanded, setExpanded] = useState(false);

  const handleResult = (idx, correct) => {
    setScores(s => ({ ...s, [idx]: correct }));
  };

  const total = rule.exercises.length;
  const correct = Object.values(scores).filter(Boolean).length;
  const done = Object.keys(scores).length;

  return (
    <div style={{
      background: "#13132a",
      border: "1px solid #22224a",
      borderRadius: 16,
      marginBottom: 20,
      overflow: "hidden"
    }}>
      {/* Header */}
      <button onClick={() => setExpanded(e => !e)} style={{
        width: "100%", background: "none", border: "none",
        padding: "18px 22px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 14, textAlign: "left"
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#c0c0ff", fontFamily: "'Georgia', serif" }}>
              {rule.title}
            </span>
            <span style={{
              fontSize: 12, color: "#7070b0", background: "#1a1a3a",
              borderRadius: 20, padding: "2px 10px", fontWeight: 500
            }}>{rule.subtitle}</span>
          </div>
        </div>
        {done > 0 && (
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: correct === total ? "#52d48a" : "#e0a050",
            background: correct === total ? "#0d2b1a" : "#2b1a0d",
            borderRadius: 20, padding: "3px 12px"
          }}>{correct}/{total}</span>
        )}
        <span style={{ color: "#4a4a8a", fontSize: 18, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>

      {expanded && (
        <div style={{ padding: "0 22px 20px" }}>
          {/* Rule explanation */}
          <div style={{
            background: "#0d0d20", borderRadius: 10, padding: "12px 16px",
            marginBottom: 16, borderLeft: "3px solid #4a4aaa"
          }}>
            <p style={{ color: "#8888cc", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              {rule.explanation}
            </p>
            <div style={{ marginTop: 10, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={{
                fontSize: 13, color: "#d45252", textDecoration: "line-through",
                fontFamily: "'Georgia', serif", fontStyle: "italic"
              }}>✗ {rule.example.wrong}</span>
              <span style={{
                fontSize: 13, color: "#52d48a",
                fontFamily: "'Georgia', serif", fontStyle: "italic"
              }}>✓ {rule.example.right}</span>
            </div>
          </div>

          {/* Exercises */}
          {rule.exercises.map((ex, idx) => (
            <ExerciseCard key={idx} exercise={ex} onResult={(c) => handleResult(idx, c)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const totalEx = RULES.reduce((s, r) => s + r.exercises.length, 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a18",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "24px 16px",
      maxWidth: 680,
      margin: "0 auto"
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{
          fontSize: 11, letterSpacing: "0.18em", color: "#4a4a8a",
          textTransform: "uppercase", marginBottom: 8
        }}>Немецкая грамматика</div>
        <h1 style={{
          fontSize: 26, fontWeight: 900, margin: 0,
          fontFamily: "'Georgia', serif",
          background: "linear-gradient(135deg, #8080ff 0%, #c080ff 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>Wortstellung</h1>
        <p style={{ color: "#4a4a8a", fontSize: 14, margin: "8px 0 0" }}>
          Порядок слов · {RULES.length} правил · {totalEx} упражнений
        </p>
      </div>

      {/* Rules */}
      {RULES.map(rule => (
        <RuleSection key={rule.id} rule={rule} />
      ))}

      <p style={{ textAlign: "center", color: "#2a2a4a", fontSize: 12, marginTop: 24 }}>
        Нажми на карточку правила, чтобы раскрыть упражнения
      </p>
    </div>
  );
}
