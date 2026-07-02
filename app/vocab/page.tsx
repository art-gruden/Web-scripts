"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BookOpen, Upload, Plus, X, Check, ChevronLeft, ChevronRight,
  Trash2, Search, Filter, RotateCcw, Loader2, FileText,
  Brain, List, Eye, EyeOff, AlertCircle, CheckCircle2,
} from "lucide-react";
import { WordWithProgress } from "@/lib/types";

const USER_ID = "user1"; // In a real app, use auth

type Tab = "flashcards" | "list" | "import" | "add";

export default function Home() {
  const [tab, setTab] = useState<Tab>("flashcards");
  const [words, setWords] = useState<WordWithProgress[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Flashcard state
  const [fcQueue, setFcQueue] = useState<WordWithProgress[]>([]);
  const [fcIndex, setFcIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [fcFilter, setFcFilter] = useState<"all" | "unknown">("unknown");
  const [fcSession, setFcSession] = useState({ known: 0, seen: 0 });

  // Import state
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Add word state
  const [addForm, setAddForm] = useState({ de: "", ru: "", synonyms: "", explanation: "", topic: "" });
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Load words
  const loadWords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId: USER_ID });
      if (selectedTopic) params.set("topic", selectedTopic);
      const res = await fetch(`/api/words?${params}`);
      const data = await res.json();
      setWords(data.words || []);
      setTopics(data.topics || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedTopic]);

  useEffect(() => { loadWords(); }, [loadWords]);

  // Build flashcard queue when words or filter change
  useEffect(() => {
    const filtered = fcFilter === "unknown"
      ? words.filter((w) => !w.known)
      : words;
    setFcQueue([...filtered].sort(() => Math.random() - 0.5));
    setFcIndex(0);
    setRevealed(false);
    setFcSession({ known: 0, seen: 0 });
  }, [words, fcFilter]);

  const currentCard = fcQueue[fcIndex];

  async function markProgress(wordId: string, action: "know" | "unsee" | "seen") {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID, wordId, action }),
    });
    setWords((prev) =>
      prev.map((w) =>
        w.id === wordId
          ? {
              ...w,
              known: action === "know" ? true : action === "unsee" ? false : w.known,
              seenCount: w.seenCount + (action === "seen" ? 1 : 0),
            }
          : w
      )
    );
  }

  async function handleKnow() {
    if (!currentCard) return;
    await markProgress(currentCard.id, "know");
    setFcSession((s) => ({ ...s, known: s.known + 1, seen: s.seen + 1 }));
    nextCard();
  }

  async function handleDontKnow() {
    if (!currentCard) return;
    await markProgress(currentCard.id, "seen");
    setFcSession((s) => ({ ...s, seen: s.seen + 1 }));
    nextCard();
  }

  function nextCard() {
    setRevealed(false);
    setFcIndex((i) => i + 1);
  }

  function prevCard() {
    setRevealed(false);
    setFcIndex((i) => Math.max(0, i - 1));
  }

  function restartFlashcards() {
    const filtered = fcFilter === "unknown" ? words.filter((w) => !w.known) : words;
    setFcQueue([...filtered].sort(() => Math.random() - 0.5));
    setFcIndex(0);
    setRevealed(false);
    setFcSession({ known: 0, seen: 0 });
  }

  // Import
  async function handleImport() {
    if (!importText.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText }),
      });
      const data = await res.json();
      setImportResult(data);
      if (data.imported > 0) {
        await loadWords();
        setImportText("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setImporting(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportText(ev.target?.result as string);
    reader.readAsText(file, "UTF-8");
  }

  // Add single word
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.de || !addForm.ru) return;
    setAdding(true);
    try {
      await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      setAddForm({ de: "", ru: "", synonyms: "", explanation: "", topic: "" });
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2500);
      await loadWords();
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  }

  // Delete word
  async function handleDelete(id: string) {
    if (!confirm("Удалить слово?")) return;
    await fetch(`/api/words?id=${id}`, { method: "DELETE" });
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  // Filtered list
  const filteredWords = words.filter((w) => {
    const q = search.toLowerCase();
    return !q || w.de.toLowerCase().includes(q) || w.ru.toLowerCase().includes(q);
  });

  const knownCount = words.filter((w) => w.known).length;
  const totalCount = words.length;
  const unknownCount = totalCount - knownCount;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        background: "var(--bg2)",
        borderBottom: "1px solid var(--border)",
        padding: "0 20px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <BookOpen size={22} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.3px" }}>
              Deutsch Vokabeln
            </span>
            <span style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: ".72rem",
              fontFamily: "var(--mono)",
              color: "var(--accent)",
            }}>B1+ / B2</span>
          </div>

          {/* Stats pill */}
          {!loading && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "5px 12px",
              fontSize: ".75rem",
              fontFamily: "var(--mono)",
            }}>
              <span style={{ color: "var(--green)" }}>✓ {knownCount}</span>
              <span style={{ color: "var(--text3)" }}>·</span>
              <span style={{ color: "var(--text2)" }}>? {unknownCount}</span>
              <span style={{ color: "var(--text3)" }}>·</span>
              <span style={{ color: "var(--text3)" }}>∑ {totalCount}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 2, paddingBottom: 1 }}>
          {([
            ["flashcards", Brain, "Карточки"],
            ["list", List, "Все слова"],
            ["add", Plus, "Добавить"],
            ["import", Upload, "Импорт"],
          ] as [Tab, React.ComponentType<{ size: number }>, string][]).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "transparent",
                border: "none",
                borderBottom: tab === id ? "2px solid var(--accent)" : "2px solid transparent",
                color: tab === id ? "var(--accent)" : "var(--text3)",
                cursor: "pointer",
                fontSize: ".82rem",
                fontWeight: tab === id ? 600 : 400,
                transition: "all .15s",
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* Topic filter bar */}
        <div style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          overflowX: "auto",
          paddingBottom: 4,
          scrollbarWidth: "none",
        }}>
          <TopicChip label="Все темы" active={!selectedTopic} onClick={() => setSelectedTopic("")} />
          {topics.map((t) => (
            <TopicChip key={t} label={t} active={selectedTopic === t} onClick={() => setSelectedTopic(t === selectedTopic ? "" : t)} />
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
            <Loader2 size={32} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* ─── FLASHCARDS ─────────────────────────────────────────────── */}
            {tab === "flashcards" && (
              <FlashcardView
                fcQueue={fcQueue}
                fcIndex={fcIndex}
                currentCard={currentCard}
                revealed={revealed}
                fcFilter={fcFilter}
                fcSession={fcSession}
                totalCount={totalCount}
                knownCount={knownCount}
                onReveal={() => setRevealed(true)}
                onKnow={handleKnow}
                onDontKnow={handleDontKnow}
                onPrev={prevCard}
                onNext={nextCard}
                onRestart={restartFlashcards}
                onFilterChange={(f) => setFcFilter(f)}
              />
            )}

            {/* ─── WORD LIST ──────────────────────────────────────────────── */}
            {tab === "list" && (
              <ListView
                words={filteredWords}
                search={search}
                onSearch={setSearch}
                onDelete={handleDelete}
                onToggleKnown={async (w) => {
                  await markProgress(w.id, w.known ? "unsee" : "know");
                }}
              />
            )}

            {/* ─── ADD WORD ───────────────────────────────────────────────── */}
            {tab === "add" && (
              <AddWordView
                form={addForm}
                adding={adding}
                success={addSuccess}
                topics={topics}
                onChange={(field, val) => setAddForm((f) => ({ ...f, [field]: val }))}
                onSubmit={handleAdd}
              />
            )}

            {/* ─── IMPORT ─────────────────────────────────────────────────── */}
            {tab === "import" && (
              <ImportView
                text={importText}
                importing={importing}
                result={importResult}
                fileRef={fileRef}
                onTextChange={setImportText}
                onFileUpload={handleFileUpload}
                onImport={handleImport}
                onClear={() => { setImportText(""); setImportResult(null); }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Topic chip ────────────────────────────────────────────────────────────────
function TopicChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        whiteSpace: "nowrap",
        padding: "5px 13px",
        borderRadius: 20,
        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
        background: active ? "var(--accent)" : "var(--surface)",
        color: active ? "#000" : "var(--text2)",
        cursor: "pointer",
        fontSize: ".75rem",
        fontFamily: "var(--mono)",
        fontWeight: active ? 600 : 400,
        flexShrink: 0,
        transition: "all .15s",
      }}
    >
      {label}
    </button>
  );
}

// ─── Flashcard view ─────────────────────────────────────────────────────────────
function FlashcardView({
  fcQueue, fcIndex, currentCard, revealed, fcFilter, fcSession,
  totalCount, knownCount, onReveal, onKnow, onDontKnow,
  onPrev, onNext, onRestart, onFilterChange,
}: {
  fcQueue: WordWithProgress[];
  fcIndex: number;
  currentCard: WordWithProgress | undefined;
  revealed: boolean;
  fcFilter: "all" | "unknown";
  fcSession: { known: number; seen: number };
  totalCount: number;
  knownCount: number;
  onReveal: () => void;
  onKnow: () => void;
  onDontKnow: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  onFilterChange: (f: "all" | "unknown") => void;
}) {
  const done = fcIndex >= fcQueue.length;
  const progress = fcQueue.length > 0 ? Math.min(fcIndex / fcQueue.length, 1) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

      {/* Filter toggle + session stats */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "var(--surface)", borderRadius: 8, padding: 3, border: "1px solid var(--border)" }}>
          {(["unknown", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: "none",
                background: fcFilter === f ? "var(--accent)" : "transparent",
                color: fcFilter === f ? "#000" : "var(--text3)",
                cursor: "pointer",
                fontSize: ".78rem",
                fontWeight: fcFilter === f ? 600 : 400,
                transition: "all .15s",
              }}
            >
              {f === "unknown" ? `Незнакомые (${totalCount - knownCount})` : `Все (${totalCount})`}
            </button>
          ))}
        </div>

        {fcSession.seen > 0 && (
          <div style={{ fontFamily: "var(--mono)", fontSize: ".74rem", color: "var(--text3)" }}>
            Сессия: <span style={{ color: "var(--green)" }}>✓ {fcSession.known}</span>
            {" / "}{fcSession.seen}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 560, height: 3, background: "var(--surface)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${progress * 100}%`,
          background: "linear-gradient(90deg, var(--accent), var(--accent2))",
          borderRadius: 2,
          transition: "width .3s",
        }} />
      </div>

      {/* Done screen */}
      {done ? (
        <div style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "52px 32px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 8 }}>Сессия завершена!</h2>
          <p style={{ color: "var(--text2)", marginBottom: 6 }}>
            Пройдено: {fcSession.seen} карточек
          </p>
          <p style={{ color: "var(--green)", marginBottom: 28, fontFamily: "var(--mono)", fontSize: ".9rem" }}>
            Знаю: {fcSession.known} / {fcSession.seen}
          </p>
          <p style={{ color: "var(--text3)", fontSize: ".82rem", marginBottom: 24 }}>
            Всего изучено: {knownCount} из {totalCount} слов
          </p>
          <button onClick={onRestart} style={btnStyle("var(--accent)")}>
            <RotateCcw size={16} /> Начать заново
          </button>
        </div>
      ) : currentCard ? (
        <>
          {/* Card */}
          <div
            onClick={!revealed ? onReveal : undefined}
            style={{
              width: "100%",
              maxWidth: 560,
              background: "var(--surface)",
              border: `1px solid ${revealed ? "var(--border2)" : "var(--border)"}`,
              borderRadius: 20,
              padding: "36px 28px",
              cursor: revealed ? "default" : "pointer",
              textAlign: "center",
              position: "relative",
              transition: "border-color .2s, box-shadow .2s",
              boxShadow: revealed ? "0 0 0 1px var(--border2)" : "none",
              minHeight: 280,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            {/* Counter */}
            <div style={{
              position: "absolute",
              top: 14,
              right: 18,
              fontFamily: "var(--mono)",
              fontSize: ".7rem",
              color: "var(--text3)",
            }}>
              {fcIndex + 1} / {fcQueue.length}
            </div>

            {/* Topic tag */}
            {currentCard.topic && (
              <div style={{
                position: "absolute",
                top: 14,
                left: 18,
                background: "var(--surface2)",
                borderRadius: 20,
                padding: "2px 10px",
                fontSize: ".67rem",
                fontFamily: "var(--mono)",
                color: "var(--accent2)",
                maxWidth: "55%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>{currentCard.topic}</div>
            )}

            {/* German word */}
            <div style={{ paddingTop: 16 }}>
              <div style={{
                fontSize: "2rem",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                marginBottom: 8,
                lineHeight: 1.2,
              }}>{currentCard.de}</div>

              {currentCard.seenCount > 0 && (
                <div style={{ fontFamily: "var(--mono)", fontSize: ".68rem", color: "var(--text3)" }}>
                  видел {currentCard.seenCount}×
                </div>
              )}
            </div>

            {/* Hidden / Revealed content */}
            {!revealed ? (
              <div style={{ color: "var(--text3)", fontSize: ".82rem", marginTop: 8 }}>
                👆 Нажмите, чтобы увидеть перевод
              </div>
            ) : (
              <div style={{
                width: "100%",
                borderTop: "1px solid var(--border)",
                paddingTop: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                textAlign: "left",
              }}>
                {/* Translation */}
                <div>
                  <div style={{ fontSize: ".68rem", color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 4 }}>ПЕРЕВОД</div>
                  <div style={{ fontSize: "1.2rem", color: "var(--green)", fontWeight: 600 }}>{currentCard.ru}</div>
                </div>

                {/* Synonyms */}
                {currentCard.synonyms && (
                  <div>
                    <div style={{ fontSize: ".68rem", color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 4 }}>СИНОНИМЫ</div>
                    <div style={{ fontSize: ".9rem", color: "var(--accent2)" }}>{currentCard.synonyms}</div>
                  </div>
                )}

                {/* Explanation */}
                {currentCard.explanation && (
                  <div>
                    <div style={{ fontSize: ".68rem", color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 4 }}>ERKLÄRUNG</div>
                    <div style={{ fontSize: ".85rem", color: "var(--text2)", lineHeight: 1.5, fontStyle: "italic" }}>
                      {currentCard.explanation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {revealed ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={onDontKnow} style={btnStyle("var(--red)")}>
                <X size={16} /> Не знаю
              </button>
              <button onClick={onKnow} style={btnStyle("var(--green)")}>
                <Check size={16} /> Знаю ✓
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onPrev} disabled={fcIndex === 0} style={navBtnStyle(fcIndex === 0)}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={onReveal} style={btnStyle("var(--accent)")}>
                <Eye size={16} /> Показать
              </button>
              <button onClick={onNext} style={navBtnStyle(fcIndex >= fcQueue.length - 1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>
          <Brain size={48} style={{ opacity: .3, marginBottom: 16 }} />
          <p>Нет слов для изучения</p>
          <p style={{ fontSize: ".82rem", marginTop: 8 }}>Добавьте слова или переключите фильтр</p>
        </div>
      )}
    </div>
  );
}

// ─── Word list view ──────────────────────────────────────────────────────────────
function ListView({
  words, search, onSearch, onDelete, onToggleKnown,
}: {
  words: WordWithProgress[];
  search: string;
  onSearch: (s: string) => void;
  onDelete: (id: string) => void;
  onToggleKnown: (w: WordWithProgress) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Поиск по немецкому или русскому..."
          style={{
            width: "100%",
            padding: "10px 14px 10px 36px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            color: "var(--text)",
            fontSize: ".87rem",
            outline: "none",
          }}
        />
      </div>

      {words.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>
          <FileText size={40} style={{ opacity: .3, marginBottom: 12 }} />
          <p>Слова не найдены</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {words.map((w) => (
            <div key={w.id} style={{
              background: "var(--surface)",
              border: `1px solid ${w.known ? "var(--green)" : "var(--border)"}`,
              borderRadius: 12,
              overflow: "hidden",
              transition: "border-color .2s",
            }}>
              {/* Row header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 14px",
                  cursor: "pointer",
                }}
                onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: ".92rem" }}>{w.de}</span>
                  <span style={{ color: "var(--text3)", margin: "0 8px" }}>—</span>
                  <span style={{ color: "var(--text2)", fontSize: ".88rem" }}>{w.ru}</span>
                </div>

                {w.topic && (
                  <span style={{
                    display: "none",
                    fontSize: ".65rem",
                    fontFamily: "var(--mono)",
                    color: "var(--accent2)",
                    background: "var(--surface2)",
                    padding: "2px 8px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                    ["@media(min-width:500px)" as string]: { display: "block" },
                  }}>{w.topic}</span>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); onToggleKnown(w); }}
                  title={w.known ? "Отметить как незнакомое" : "Отметить как знакомое"}
                  style={{
                    width: 28, height: 28,
                    borderRadius: "50%",
                    border: `1px solid ${w.known ? "var(--green)" : "var(--border)"}`,
                    background: w.known ? "var(--green)" : "transparent",
                    color: w.known ? "#000" : "var(--text3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {w.known ? <Check size={13} /> : <EyeOff size={13} />}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(w.id); }}
                  style={{
                    width: 28, height: 28,
                    borderRadius: "50%",
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--red)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Expanded details */}
              {expandedId === w.id && (w.synonyms || w.explanation || w.topic) && (
                <div style={{
                  borderTop: "1px solid var(--border)",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}>
                  {w.topic && (
                    <Row label="Тема" value={w.topic} color="var(--accent2)" />
                  )}
                  {w.synonyms && (
                    <Row label="Синонимы" value={w.synonyms} color="var(--accent)" />
                  )}
                  {w.explanation && (
                    <Row label="Erklärung" value={w.explanation} color="var(--text2)" italic />
                  )}
                  {w.seenCount > 0 && (
                    <Row label="Видел" value={`${w.seenCount}×`} color="var(--text3)" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color, italic }: { label: string; value: string; color: string; italic?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: ".67rem", color: "var(--text3)", flexShrink: 0, paddingTop: 2, minWidth: 70 }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: ".82rem", color, fontStyle: italic ? "italic" : "normal", lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}

// ─── Add word view ────────────────────────────────────────────────────────────────
function AddWordView({
  form, adding, success, topics, onChange, onSubmit,
}: {
  form: Record<string, string>;
  adding: boolean;
  success: boolean;
  topics: string[];
  onChange: (field: string, val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 20 }}>
        <Plus size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />
        Добавить слово
      </h2>

      {success && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(52,211,153,.1)",
          border: "1px solid var(--green)",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 16,
          color: "var(--green)",
          fontSize: ".85rem",
        }}>
          <CheckCircle2 size={16} /> Слово добавлено!
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { field: "de", label: "Немецкое слово *", placeholder: "z.B. die Weiterbildung", required: true },
          { field: "ru", label: "Перевод на русский *", placeholder: "повышение квалификации", required: true },
          { field: "synonyms", label: "Синонимы (на немецком)", placeholder: "z.B. die Fortbildung, die Schulung" },
          { field: "explanation", label: "Объяснение (на немецком)", placeholder: "z.B. Eine Maßnahme, um berufliche Kenntnisse zu verbessern" },
        ].map(({ field, label, placeholder, required }) => (
          <div key={field}>
            <label style={{ fontSize: ".78rem", color: "var(--text3)", fontFamily: "var(--mono)", display: "block", marginBottom: 6 }}>{label}</label>
            {field === "explanation" ? (
              <textarea
                value={form[field]}
                onChange={(e) => onChange(field, e.target.value)}
                placeholder={placeholder}
                rows={3}
                style={inputStyle}
              />
            ) : (
              <input
                type="text"
                value={form[field]}
                onChange={(e) => onChange(field, e.target.value)}
                placeholder={placeholder}
                required={required}
                style={inputStyle}
              />
            )}
          </div>
        ))}

        {/* Topic - datalist */}
        <div>
          <label style={{ fontSize: ".78rem", color: "var(--text3)", fontFamily: "var(--mono)", display: "block", marginBottom: 6 }}>Тема / Глава</label>
          <input
            type="text"
            value={form.topic}
            onChange={(e) => onChange("topic", e.target.value)}
            placeholder="z.B. Kapitel 1 – Schule"
            list="topics-list"
            style={inputStyle}
          />
          <datalist id="topics-list">
            {topics.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>

        <button
          type="submit"
          disabled={adding || !form.de || !form.ru}
          style={btnStyle("var(--accent)", adding || !form.de || !form.ru)}
        >
          {adding ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={15} />}
          Добавить слово
        </button>
      </form>
    </div>
  );
}

// ─── Import view ──────────────────────────────────────────────────────────────────
function ImportView({
  text, importing, result, fileRef, onTextChange, onFileUpload, onImport, onClear,
}: {
  text: string;
  importing: boolean;
  result: { imported: number; skipped: number; errors: string[] } | null;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onTextChange: (t: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  onClear: () => void;
}) {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>
        <Upload size={18} style={{ verticalAlign: "middle", marginRight: 6 }} />
        Импорт слов
      </h2>

      {/* Format spec */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}>
        <div style={{ fontSize: ".75rem", fontFamily: "var(--mono)", color: "var(--accent2)", marginBottom: 10 }}>
          ФОРМАТ ФАЙЛА (одна строка = одно слово)
        </div>
        <div style={{
          fontFamily: "var(--mono)",
          fontSize: ".8rem",
          color: "var(--text2)",
          lineHeight: 2,
        }}>
          <span style={{ color: "var(--accent)" }}>немецкое слово</span>
          <span style={{ color: "var(--text3)" }}>/</span>
          <span style={{ color: "var(--green)" }}>перевод на русский</span>
          <span style={{ color: "var(--text3)" }}>/</span>
          <span style={{ color: "var(--accent2)" }}>синонимы на немецком</span>
          <span style={{ color: "var(--text3)" }}>/</span>
          <span style={{ color: "var(--yellow)" }}>объяснение на немецком</span>
          <span style={{ color: "var(--text3)" }}>/</span>
          <span style={{ color: "var(--accent3)" }}>тема по книге</span>
        </div>
        <div style={{
          marginTop: 10,
          padding: "10px 14px",
          background: "var(--bg2)",
          borderRadius: 8,
          fontFamily: "var(--mono)",
          fontSize: ".75rem",
          color: "var(--text3)",
          lineHeight: 1.8,
        }}>
          <div style={{ color: "var(--text3)" }}># Знак # = комментарий, строка игнорируется</div>
          <div>
            <span style={{ color: "var(--accent)" }}>die Weiterbildung</span>/
            <span style={{ color: "var(--green)" }}>повышение квалификации</span>/
            <span style={{ color: "var(--accent2)" }}>die Fortbildung</span>/
            <span style={{ color: "var(--yellow)" }}>Maßnahme zur Verbesserung beruflicher Kenntnisse</span>/
            <span style={{ color: "var(--accent3)" }}>Kap. 1</span>
          </div>
          <div>
            <span style={{ color: "var(--accent)" }}>der Betrieb</span>/
            <span style={{ color: "var(--green)" }}>предприятие</span>///
            <span style={{ color: "var(--accent3)" }}>Kap. 2</span>
          </div>
          <div style={{ color: "var(--text3)", fontSize: ".7rem", marginTop: 4 }}>
            ↑ Поля синонимов и объяснения можно оставить пустыми (///)
          </div>
        </div>
      </div>

      {/* File upload */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 16px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text2)",
            cursor: "pointer",
            fontSize: ".82rem",
          }}
        >
          <FileText size={14} /> Загрузить .txt файл
        </button>
        {text && (
          <button onClick={onClear} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", background: "transparent",
            border: "1px solid var(--border)", borderRadius: 8,
            color: "var(--red)", cursor: "pointer", fontSize: ".82rem",
          }}>
            <X size={14} /> Очистить
          </button>
        )}
        <input ref={fileRef} type="file" accept=".txt,.csv" style={{ display: "none" }} onChange={onFileUpload} />
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={"# Вставьте текст здесь или загрузите файл\ndie Weiterbildung/повышение квалификации/die Fortbildung/Maßnahme zur Verbesserung von Kenntnissen/Kap. 1"}
        rows={14}
        style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--mono)", fontSize: ".78rem", lineHeight: 1.7 }}
      />

      {/* Stats bar */}
      {text && (
        <div style={{ fontSize: ".75rem", color: "var(--text3)", fontFamily: "var(--mono)", marginTop: 6, marginBottom: 12 }}>
          Строк с данными: {text.split("\n").filter(l => l.trim() && !l.trim().startsWith("#")).length}
        </div>
      )}

      <button
        onClick={onImport}
        disabled={importing || !text.trim()}
        style={btnStyle("var(--accent)", importing || !text.trim())}
      >
        {importing ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={15} />}
        {importing ? "Импортируем..." : "Импортировать"}
      </button>

      {/* Result */}
      {result && (
        <div style={{
          marginTop: 16,
          background: "var(--surface)",
          border: `1px solid ${result.imported > 0 ? "var(--green)" : "var(--border)"}`,
          borderRadius: 12,
          padding: 16,
        }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: result.errors.length ? 10 : 0 }}>
            {result.imported > 0
              ? <CheckCircle2 size={16} color="var(--green)" />
              : <AlertCircle size={16} color="var(--yellow)" />
            }
            <span style={{ fontSize: ".85rem", fontWeight: 600 }}>
              {result.imported > 0 ? `Добавлено: ${result.imported} слов` : "Ничего не добавлено"}
              {result.skipped > 0 && ` · Пропущено: ${result.skipped}`}
            </span>
          </div>
          {result.errors.length > 0 && (
            <div style={{ fontSize: ".75rem", fontFamily: "var(--mono)", color: "var(--red)", lineHeight: 1.7 }}>
              {result.errors.map((e, i) => <div key={i}>⚠ {e}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--text)",
  fontSize: ".87rem",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color .15s",
};

function btnStyle(color: string, disabled = false): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "10px 22px",
    background: disabled ? "var(--surface)" : color,
    border: `1px solid ${disabled ? "var(--border)" : color}`,
    borderRadius: 10,
    color: disabled ? "var(--text3)" : color === "var(--accent)" ? "#000" : "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: ".85rem",
    fontWeight: 600,
    transition: "all .15s",
    opacity: disabled ? 0.6 : 1,
  };
}

function navBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    color: disabled ? "var(--text3)" : "var(--text)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
  };
}
