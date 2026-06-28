"use client";

import { useEffect, useRef, useState } from "react";

type TabName = "meanings" | "quiz" | "builder" | "perfekt" | "leaderboard";
type QuizMode = "quiz" | "perfekt";
type Lang = "ua" | "de";

interface UIStrings {
  tabs: string[];
  tabIds: TabName[];
  subtitle: string;
  loading: string;
  next: string;
  correct: string;
  wrong: string;
  hint: string;
  check: string;
  skip: string;
  taskLabel: string;
  taskCounter: (i: number, t: number) => string;
  inputPlaceholder: string;
  greatAnswer: string;
  wrongAnswer: string;
  restart: string;
  allDone: string;
  allDoneMsg: (n: number) => string;
  saveName: string;
  namePlaceholder: string;
  save: string;
  saveErr: string;
  saved: (rank: number | null) => string;
  leaderTitle: string;
  leaderRefresh: string;
  leaderEmpty: string;
  leaderErr: string;
  perfekt: string;
  resultMsg: (pct: number) => string;
  resultScore: (ok: number, total: number, pct: number) => string;
  quizCounter: (i: number, t: number) => string;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  rank: number;
}

// ============================================================
// ПЕРЕКЛАДИ UI
// ============================================================
const UI: Record<Lang, UIStrings> = {
  ua: {
    tabs: ["📚 Значення", "🎯 Тест", "✍️ Речення", "⏱ Перфект", "🏆 Лідери"],
    tabIds: ["meanings", "quiz", "builder", "perfekt", "leaderboard"] as TabName[],
    subtitle: "B2 · Тренажер дієслова",
    loading: "Завантаження…",
    next: "Далі →",
    correct: "✓ Правильно!",
    wrong: "✗ Неправильно.",
    hint: "💡 Підказка",
    check: "Перевірити",
    skip: "Пропустити",
    taskLabel: "Перекладіть / Доповніть",
    taskCounter: (i: number, t: number) => `Завдання ${i} / ${t}`,
    inputPlaceholder: "Введіть відповідь...",
    greatAnswer: "✓ Чудово!",
    wrongAnswer: "✗ Не зовсім. Правильна відповідь:",
    restart: "Спробувати знову",
    allDone: "Завдання завершено!",
    allDoneMsg: (n: number) => `Всі ${n} вправ пройдено.`,
    saveName: "Зберегти результат у таблицю лідерів?",
    namePlaceholder: "Твоє ім'я...",
    save: "Зберегти",
    saveErr: "Помилка збереження.",
    saved: (rank: number | null) => rank ? `✓ Збережено! Твій ранг: #${rank}` : "✓ Збережено!",
    leaderTitle: "🏆 Таблиця лідерів",
    leaderRefresh: "↻ Оновити",
    leaderEmpty: "Ще немає результатів. Пройди тест і збережи своє імʼя!",
    leaderErr: "Помилка. Перевір налаштування Upstash в Vercel Dashboard.",
    perfekt: "Perfekt:",
    resultMsg: (pct: number) => pct >= 80 ? "Відмінно!" : pct >= 50 ? "Непогано, продовжуй!" : "Потренуйся ще раз!",
    resultScore: (ok: number, total: number, pct: number) => `Результат: ${ok} / ${total} (${pct}%)`,
    quizCounter: (i: number, t: number) => `${i} / ${t}`,
  },
  de: {
    tabs: ["📚 Bedeutungen", "🎯 Test", "✍️ Sätze", "⏱ Perfekt", "🏆 Rangliste"],
    tabIds: ["meanings", "quiz", "builder", "perfekt", "leaderboard"] as TabName[],
    subtitle: "B2 · Verb-Trainer",
    loading: "Wird geladen…",
    next: "Weiter →",
    correct: "✓ Richtig!",
    wrong: "✗ Falsch.",
    hint: "💡 Hinweis",
    check: "Überprüfen",
    skip: "Überspringen",
    taskLabel: "Übersetzen / Ergänzen",
    taskCounter: (i: number, t: number) => `Aufgabe ${i} / ${t}`,
    inputPlaceholder: "Antwort eingeben...",
    greatAnswer: "✓ Sehr gut!",
    wrongAnswer: "✗ Nicht ganz. Richtige Antwort:",
    restart: "Nochmal versuchen",
    allDone: "Alle Aufgaben erledigt!",
    allDoneMsg: (n: number) => `Alle ${n} Übungen abgeschlossen.`,
    saveName: "Ergebnis in die Rangliste speichern?",
    namePlaceholder: "Dein Name...",
    save: "Speichern",
    saveErr: "Fehler beim Speichern.",
    saved: (rank: number | null) => rank ? `✓ Gespeichert! Dein Rang: #${rank}` : "✓ Gespeichert!",
    leaderTitle: "🏆 Rangliste",
    leaderRefresh: "↻ Aktualisieren",
    leaderEmpty: "Noch keine Ergebnisse. Mach den Test und speichere deinen Namen!",
    leaderErr: "Fehler. Bitte Upstash-Einstellungen im Vercel Dashboard prüfen.",
    perfekt: "Perfekt:",
    resultMsg: (pct: number) => pct >= 80 ? "Ausgezeichnet!" : pct >= 50 ? "Nicht schlecht, weiter so!" : "Noch mal üben!",
    resultScore: (ok: number, total: number, pct: number) => `Ergebnis: ${ok} / ${total} (${pct}%)`,
    quizCounter: (i: number, t: number) => `${i} / ${t}`,
  },
};

// ============================================================
// ДАНІ — значення lassen
// ============================================================
const meanings = [
  {
    num: "1",
    tag: { ua: "nicht mitnehmen", de: "nicht mitnehmen" },
    title: { ua: "Залишити / не брати з собою", de: "Etw. zurücklassen / nicht mitnehmen" },
    examples: [
      { de: "Kann ich meinen Koffer hier lassen?", ua: "Можна залишити валізу тут?" },
      { de: "Ich habe meinen Koffer hier gelassen.", ua: "Я залишив валізу тут." },
    ],
    perfekt: "gelassen", color: "#6c8ef5",
  },
  {
    num: "2",
    tag: { ua: "nicht selbst machen", de: "nicht selbst machen" },
    title: { ua: "Доручити / через когось", de: "Etw. von jmd. anderem erledigen lassen" },
    examples: [
      { de: "Ich lasse meine Haare schneiden.", ua: "Я стрижуся (у когось)." },
      { de: "Ich habe meine Haare schneiden lassen.", ua: "Я постригся." },
    ],
    perfekt: "(Verb) + lassen", color: "#a78bfa",
  },
  {
    num: "3",
    tag: { ua: "(nicht) erlauben", de: "(nicht) erlauben" },
    title: { ua: "Дозволяти / не дозволяти", de: "Etw. erlauben oder verbieten" },
    examples: [
      { de: "Ich lasse mein Kind nicht fernsehen.", ua: "Я не дозволяю дитині дивитися ТВ." },
      { de: "Ich habe mein Kind nicht fernsehen lassen.", ua: "(перфект)" },
    ],
    perfekt: "(Verb) + lassen", color: "#34d399",
  },
  {
    num: "4",
    tag: { ua: "Aufforderung zu Aktion", de: "Aufforderung zu geme. Aktion" },
    title: { ua: "Заклик до спільної дії", de: "Gemeinsamen Vorschlag machen" },
    examples: [{ de: "Lass(t) uns gehen!", ua: "Ходімо! / Давай підемо!" }],
    perfekt: "— (kein Perfekt)", color: "#fbbf24",
  },
  {
    num: "5",
    tag: { ua: "etwas für jemanden tun", de: "etwas für jemanden tun" },
    title: { ua: "Зробити щось для когось", de: "Anbieten, etw. für jmd. zu tun" },
    examples: [{ de: "Lass mich ihn tragen.", ua: "Дай я понесу (для тебе)." }],
    perfekt: "— (kein Perfekt)", color: "#f87171",
  },
  {
    num: "6",
    tag: { ua: "kann … werden", de: "kann … werden" },
    title: { ua: "Можливість / пасивний потенціал", de: "Möglichkeit / passives Potenzial" },
    examples: [
      { de: "Viele Krankheiten lassen sich heilen.", ua: "Багато хвороб піддаються лікуванню." },
      { de: "Sie haben sich heilen lassen.", ua: "(перфект)" },
    ],
    perfekt: "(Verb) + lassen", color: "#38bdf8",
  },
  {
    num: "7",
    tag: { ua: "nicht machen / aufhören", de: "nicht machen / aufhören" },
    title: { ua: "Припинити / перестати", de: "Mit etw. aufhören / etw. bleiben lassen" },
    examples: [
      { de: "Viele Leute können das Rauchen nicht lassen.", ua: "Багато людей не можуть кинути курити." },
      { de: "Er hat das Rauchen nicht gelassen.", ua: "(перфект)" },
    ],
    perfekt: "gelassen", color: "#fb923c",
  },
  {
    num: "8",
    tag: { ua: "der Grund sein", de: "der Grund sein" },
    title: { ua: "Бути причиною / спонукати", de: "Ursache sein / jmd. veranlassen" },
    examples: [
      { de: "Das schlechte Wetter ließ sie depressiv werden.", ua: "Погода змусила її впасти у депресію." },
      { de: "Es hat sie depressiv werden lassen.", ua: "(перфект)" },
    ],
    perfekt: "(Verb) + lassen", color: "#e879f9",
  },
];

// ============================================================
// ПИТАННЯ ТЕСТУ (двомовні)
// ============================================================
const quizQuestions = [
  {
    q: { ua: "«Das Erdbeben ließ viele Häuser einstürzen.» — яке значення lassen?", de: "«Das Erdbeben ließ viele Häuser einstürzen.» — Welche Bedeutung hat lassen?" },
    correct: { ua: "der Grund sein (бути причиною)", de: "der Grund sein (Ursache)" },
    options: { ua: ["nicht mitnehmen", "der Grund sein (бути причиною)", "nicht machen / aufhören", "Aufforderung zu Aktion"], de: ["nicht mitnehmen", "der Grund sein (Ursache)", "nicht machen / aufhören", "Aufforderung zu Aktion"] },
    explanation: { ua: "Землетрус спричинив руйнування — lassen = бути причиною (Bed. 8).", de: "Das Erdbeben verursachte den Einsturz — lassen = Ursache sein (Bed. 8)." },
  },
  {
    q: { ua: "«Lass doch das Trinken!» — яке значення lassen?", de: "«Lass doch das Trinken!» — Welche Bedeutung hat lassen?" },
    correct: { ua: "nicht machen / aufhören", de: "nicht machen / aufhören" },
    options: { ua: ["etwas für jemanden tun", "nicht selbst machen", "nicht machen / aufhören", "der Grund sein"], de: ["etwas für jemanden tun", "nicht selbst machen", "nicht machen / aufhören", "der Grund sein"] },
    explanation: { ua: "Припини пити! — lassen = перестати (Bed. 7).", de: "Hör auf zu trinken! — lassen = aufhören (Bed. 7)." },
  },
  {
    q: { ua: "«Kann ich meinen Koffer am Flughafen lassen?» — яке значення?", de: "«Kann ich meinen Koffer am Flughafen lassen?» — Welche Bedeutung?" },
    correct: { ua: "nicht mitnehmen (залишити)", de: "nicht mitnehmen (zurücklassen)" },
    options: { ua: ["nicht mitnehmen (залишити)", "(nicht) erlauben", "nicht selbst machen", "kann … werden"], de: ["nicht mitnehmen (zurücklassen)", "(nicht) erlauben", "nicht selbst machen", "kann … werden"] },
    explanation: { ua: "Залишити валізу — lassen = nicht mitnehmen (Bed. 1).", de: "Den Koffer dalassen — lassen = nicht mitnehmen (Bed. 1)." },
  },
  {
    q: { ua: "«Ich möchte meine Wohnung renovieren lassen.» — яке значення?", de: "«Ich möchte meine Wohnung renovieren lassen.» — Welche Bedeutung?" },
    correct: { ua: "nicht selbst machen (доручити)", de: "nicht selbst machen (beauftragen)" },
    options: { ua: ["nicht machen / aufhören", "nicht selbst machen (доручити)", "der Grund sein", "Aufforderung zu Aktion"], de: ["nicht machen / aufhören", "nicht selbst machen (beauftragen)", "der Grund sein", "Aufforderung zu Aktion"] },
    explanation: { ua: "Хочу щоб хтось відремонтував — Bed. 2.", de: "Jemanden mit der Renovierung beauftragen — Bed. 2." },
  },
  {
    q: { ua: "«Wir haben den Vogel fliegen lassen.» — яке значення?", de: "«Wir haben den Vogel fliegen lassen.» — Welche Bedeutung?" },
    correct: { ua: "(nicht) erlauben / дозволити", de: "(nicht) erlauben / freilassen" },
    options: { ua: ["nicht mitnehmen", "nicht machen / aufhören", "(nicht) erlauben / дозволити", "etwas für jemanden tun"], de: ["nicht mitnehmen", "nicht machen / aufhören", "(nicht) erlauben / freilassen", "etwas für jemanden tun"] },
    explanation: { ua: "Відпустили птаха — lassen = erlauben (Bed. 3).", de: "Den Vogel freigelassen — lassen = erlauben (Bed. 3)." },
  },
  {
    q: { ua: "«Lasst uns endlich aufhören zu arbeiten!» — яке значення?", de: "«Lasst uns endlich aufhören zu arbeiten!» — Welche Bedeutung?" },
    correct: { ua: "Aufforderung zu Aktion", de: "Aufforderung zu Aktion" },
    options: { ua: ["nicht machen / aufhören", "Aufforderung zu Aktion", "etwas für jemanden tun", "der Grund sein"], de: ["nicht machen / aufhören", "Aufforderung zu Aktion", "etwas für jemanden tun", "der Grund sein"] },
    explanation: { ua: "Давайте закінчимо! — спільний заклик (Bed. 4).", de: "Gemeinsamer Vorschlag: Lass uns aufhören! — Bed. 4." },
  },
  {
    q: { ua: "«Lass mich das machen! Ich habe Zeit.» — яке значення?", de: "«Lass mich das machen! Ich habe Zeit.» — Welche Bedeutung?" },
    correct: { ua: "etwas für jemanden tun", de: "etwas für jemanden tun" },
    options: { ua: ["nicht selbst machen", "kann … werden", "etwas für jemanden tun", "nicht mitnehmen"], de: ["nicht selbst machen", "kann … werden", "etwas für jemanden tun", "nicht mitnehmen"] },
    explanation: { ua: "Дай я це зроблю — пропозиція допомоги (Bed. 5).", de: "Angebot, etw. für jmd. zu tun (Bed. 5)." },
  },
  {
    q: { ua: "«Lässt sich das Auto noch reparieren?» — яке значення?", de: "«Lässt sich das Auto noch reparieren?» — Welche Bedeutung?" },
    correct: { ua: "kann … werden (потенціал)", de: "kann … werden (Möglichkeit)" },
    options: { ua: ["der Grund sein", "nicht machen / aufhören", "(nicht) erlauben", "kann … werden (потенціал)"], de: ["der Grund sein", "nicht machen / aufhören", "(nicht) erlauben", "kann … werden (Möglichkeit)"] },
    explanation: { ua: "Чи можна відремонтувати? — sich lassen = kann werden (Bed. 6).", de: "Kann das Auto repariert werden? — sich lassen = kann werden (Bed. 6)." },
  },
  {
    q: { ua: "Perfekt: «Ich habe meine Haare schneiden ___»", de: "Perfekt: «Ich habe meine Haare schneiden ___»" },
    correct: { ua: "lassen", de: "lassen" },
    options: { ua: ["gelassen", "lassen", "zu lassen", "lässt"], de: ["gelassen", "lassen", "zu lassen", "lässt"] },
    explanation: { ua: "З іншим дієсловом → Verb + lassen (не gelassen).", de: "Mit einem anderen Infinitiv → Verb + lassen (nicht gelassen)." },
  },
  {
    q: { ua: "Perfekt: «Er hat das Rauchen nicht ___»", de: "Perfekt: «Er hat das Rauchen nicht ___»" },
    correct: { ua: "gelassen", de: "gelassen" },
    options: { ua: ["lassen", "gelassen", "lässt", "zu lassen"], de: ["lassen", "gelassen", "lässt", "zu lassen"] },
    explanation: { ua: "Без іншого дієслова → gelassen (Bed. 7).", de: "Ohne anderen Infinitiv → gelassen (Bed. 7)." },
  },
  {
    q: { ua: "Perfekt: «Sie haben sich heilen ___»", de: "Perfekt: «Sie haben sich heilen ___»" },
    correct: { ua: "lassen", de: "lassen" },
    options: { ua: ["gelassen", "lassen", "lässt", "zu lassen"], de: ["gelassen", "lassen", "lässt", "zu lassen"] },
    explanation: { ua: "sich lassen + Infinitiv → Verb + lassen.", de: "sich lassen + Infinitiv → Verb + lassen." },
  },
  {
    q: { ua: "«Ich lasse mein Kind NICHT fernsehen.» — яке значення?", de: "«Ich lasse mein Kind NICHT fernsehen.» — Welche Bedeutung?" },
    correct: { ua: "(nicht) erlauben — НЕ дозволяти", de: "(nicht) erlauben — verbieten" },
    options: { ua: ["nicht mitnehmen", "nicht machen / aufhören", "nicht selbst machen", "(nicht) erlauben — НЕ дозволяти"], de: ["nicht mitnehmen", "nicht machen / aufhören", "nicht selbst machen", "(nicht) erlauben — verbieten"] },
    explanation: { ua: "Не дозволяю дитині — Bed. 3.", de: "Dem Kind etw. verbieten — Bed. 3." },
  },
];

const perfektQuestions = [
  {
    q: { ua: "«Ich habe meinen Koffer hier ___» (залишив, без другого дієслова)", de: "«Ich habe meinen Koffer hier ___» (zurückgelassen, kein zweiter Infinitiv)" },
    correct: { ua: "gelassen", de: "gelassen" },
    options: { ua: ["lassen", "gelassen", "gelasst", "lässt"], de: ["lassen", "gelassen", "gelasst", "lässt"] },
    explanation: { ua: "Bed. 1 — lassen без іншого дієслова → gelassen.", de: "Bed. 1 — lassen ohne Infinitiv → gelassen." },
  },
  {
    q: { ua: "«Ich habe meine Haare schneiden ___» (у майстра)", de: "«Ich habe meine Haare schneiden ___» (beim Friseur)" },
    correct: { ua: "lassen", de: "lassen" },
    options: { ua: ["gelassen", "lassen", "gelasst", "zu lassen"], de: ["gelassen", "lassen", "gelasst", "zu lassen"] },
    explanation: { ua: "Bed. 2 — два дієслова → Verb + lassen.", de: "Bed. 2 — zwei Verben → Verb + lassen." },
  },
  {
    q: { ua: "«Er hat das Rauchen nicht ___»", de: "«Er hat das Rauchen nicht ___»" },
    correct: { ua: "gelassen", de: "gelassen" },
    options: { ua: ["lassen", "gelassen", "lässt", "gelasst"], de: ["lassen", "gelassen", "lässt", "gelasst"] },
    explanation: { ua: "Bed. 7 — lassen без іншого дієслова → gelassen.", de: "Bed. 7 — lassen ohne Infinitiv → gelassen." },
  },
  {
    q: { ua: "«Das Wetter hat sie depressiv werden ___»", de: "«Das Wetter hat sie depressiv werden ___»" },
    correct: { ua: "lassen", de: "lassen" },
    options: { ua: ["gelassen", "lassen", "gelasst", "zu lassen"], de: ["gelassen", "lassen", "gelasst", "zu lassen"] },
    explanation: { ua: "Bed. 8 — два дієслова → Verb + lassen.", de: "Bed. 8 — zwei Verben → Verb + lassen." },
  },
  {
    q: { ua: "«Ich habe mein Kind nicht fernsehen ___»", de: "«Ich habe mein Kind nicht fernsehen ___»" },
    correct: { ua: "lassen", de: "lassen" },
    options: { ua: ["gelassen", "lassen", "lässt", "gelasst"], de: ["gelassen", "lassen", "lässt", "gelasst"] },
    explanation: { ua: "Bed. 3 — два дієслова → Verb + lassen.", de: "Bed. 3 — zwei Verben → Verb + lassen." },
  },
  {
    q: { ua: "«Sie haben sich heilen ___» (хворі вилікувались)", de: "«Sie haben sich heilen ___» (die Kranken wurden geheilt)" },
    correct: { ua: "lassen", de: "lassen" },
    options: { ua: ["gelassen", "lassen", "gelasst", "zu lassen"], de: ["gelassen", "lassen", "gelasst", "zu lassen"] },
    explanation: { ua: "Bed. 6 — sich lassen → Verb + lassen.", de: "Bed. 6 — sich lassen → Verb + lassen." },
  },
  {
    q: { ua: "Правило: коли Perfekt → GELASSEN?", de: "Regel: Wann Perfekt → GELASSEN?" },
    correct: { ua: "Коли lassen без іншого інфінітива (Bed. 1, 7)", de: "Wenn lassen ohne zweiten Infinitiv steht (Bed. 1, 7)" },
    options: { ua: ["Коли lassen без іншого інфінітива (Bed. 1, 7)", "Завжди", "Коли lassen з іншим дієсловом", "Тільки у значенні 4"], de: ["Wenn lassen ohne zweiten Infinitiv steht (Bed. 1, 7)", "Immer", "Wenn lassen mit einem anderen Verb steht", "Nur in Bedeutung 4"] },
    explanation: { ua: "lassen + інфінітив → lassen. Lassen один → gelassen.", de: "lassen + Infinitiv → lassen. lassen allein → gelassen." },
  },
  {
    q: { ua: "«Wir haben ihn warten ___» (змусили чекати)", de: "«Wir haben ihn warten ___» (wir haben gewartet lassen)" },
    correct: { ua: "lassen", de: "lassen" },
    options: { ua: ["gelassen", "lassen", "lässt", "zu lassen"], de: ["gelassen", "lassen", "lässt", "zu lassen"] },
    explanation: { ua: "warten + lassen → Perfekt: warten lassen.", de: "warten + lassen → Perfekt: warten lassen." },
  },
];

const sbExercises = [
  { prompt: { ua: "Залиш валізу тут! (du, Imperativ)", de: "Lass den Koffer hier! (du, Imperativ)" }, answers: ["Lass den Koffer hier!", "Lass deinen Koffer hier!"], hint: { ua: "lassen → Imperativ du = Lass", de: "lassen → Imperativ du = Lass" }, explanation: { ua: "Bed. 1: nicht mitnehmen", de: "Bed. 1: nicht mitnehmen" } },
  { prompt: { ua: "Я постриглася у перукаря. (Perfekt)", de: "Ich habe mir die Haare schneiden lassen. (Perfekt)" }, answers: ["Ich habe meine Haare schneiden lassen.", "Ich habe mir die Haare schneiden lassen."], hint: { ua: "haben + Haare + schneiden + lassen", de: "haben + Haare + schneiden + lassen" }, explanation: { ua: "Bed. 2: Perfekt = Verb + lassen", de: "Bed. 2: Perfekt = Verb + lassen" } },
  { prompt: { ua: "Ходімо нарешті! (Lass uns...)", de: "Lasst uns endlich gehen! (Aufforderung)" }, answers: ["Lasst uns endlich gehen!", "Lass uns endlich gehen!"], hint: { ua: "Lasst uns / Lass uns + Infinitiv", de: "Lasst uns / Lass uns + Infinitiv" }, explanation: { ua: "Bed. 4: Aufforderung. Kein Perfekt.", de: "Bed. 4: Aufforderung. Kein Perfekt." } },
  { prompt: { ua: "Дай я це зроблю — у мене є час.", de: "Lass mich das machen! (Angebot)" }, answers: ["Lass mich das machen! Ich habe Zeit.", "Lass mich das tun! Ich habe Zeit."], hint: { ua: "Lass mich + Infinitiv", de: "Lass mich + Infinitiv" }, explanation: { ua: "Bed. 5: etwas für jemanden tun. Kein Perfekt.", de: "Bed. 5: etwas für jemanden tun. Kein Perfekt." } },
  { prompt: { ua: "Ця проблема не піддається вирішенню.", de: "Dieses Problem lässt sich nicht lösen." }, answers: ["Dieses Problem lässt sich nicht lösen.", "Das Problem lässt sich nicht lösen."], hint: { ua: "lässt sich + Infinitiv", de: "lässt sich + Infinitiv" }, explanation: { ua: "Bed. 6: kann nicht gelöst werden.", de: "Bed. 6: kann nicht gelöst werden." } },
  { prompt: { ua: "Я відремонтував машину у майстра. (Perfekt)", de: "Ich habe das Auto reparieren lassen. (Perfekt)" }, answers: ["Ich habe das Auto reparieren lassen.", "Ich habe mein Auto reparieren lassen."], hint: { ua: "haben + reparieren + lassen", de: "haben + reparieren + lassen" }, explanation: { ua: "Bed. 2: Perfekt = Verb + lassen.", de: "Bed. 2: Perfekt = Verb + lassen." } },
  { prompt: { ua: "Він не може кинути куріти.", de: "Er kann das Rauchen nicht lassen." }, answers: ["Er kann das Rauchen nicht lassen."], hint: { ua: "nicht + lassen як фінальне дієслово", de: "nicht + lassen als finales Verb" }, explanation: { ua: "Bed. 7: nicht machen / aufhören.", de: "Bed. 7: nicht machen / aufhören." } },
  { prompt: { ua: "Погана новина змусила її плакати.", de: "Die schlechte Nachricht ließ sie weinen." }, answers: ["Die schlechte Nachricht ließ sie weinen.", "Die schlechte Nachricht hat sie weinen lassen."], hint: { ua: "ließ + Akk + Infinitiv або Perfekt", de: "ließ + Akk. + Infinitiv oder Perfekt" }, explanation: { ua: "Bed. 8: der Grund sein.", de: "Bed. 8: der Grund sein." } },
  { prompt: { ua: "Ми не дозволяємо собаці спати на дивані.", de: "Wir lassen den Hund nicht auf dem Sofa schlafen." }, answers: ["Wir lassen den Hund nicht auf dem Sofa schlafen.", "Wir lassen unseren Hund nicht auf dem Sofa schlafen."], hint: { ua: "lassen + Akk + nicht + Infinitiv", de: "lassen + Akk. + nicht + Infinitiv" }, explanation: { ua: "Bed. 3: nicht erlauben.", de: "Bed. 3: nicht erlauben." } },
  { prompt: { ua: "Залишіть мені повідомлення! (ihr)", de: "Lasst mir eine Nachricht! (ihr, Imperativ)" }, answers: ["Lasst mir eine Nachricht!"], hint: { ua: "Lasst = Imperativ für ihr", de: "Lasst = Imperativ Plural" }, explanation: { ua: "Imperativ ihr = Lasst.", de: "Imperativ ihr = Lasst." } },
  { prompt: { ua: "Чи можна автоматизувати це завдання?", de: "Lässt sich diese Aufgabe automatisieren?" }, answers: ["Lässt sich diese Aufgabe automatisieren?", "Lässt sich die Aufgabe automatisieren?"], hint: { ua: "Lässt sich + Infinitiv (питання)", de: "Lässt sich + Infinitiv (Frage)" }, explanation: { ua: "Bed. 6 у DevOps-контексті.", de: "Bed. 6 im DevOps-Kontext." } },
  { prompt: { ua: "Вона попросила відремонтувати сервер. (Perfekt)", de: "Sie hat den Server reparieren lassen. (Perfekt)" }, answers: ["Sie hat den Server reparieren lassen."], hint: { ua: "hat + reparieren + lassen", de: "hat + reparieren + lassen" }, explanation: { ua: "Bed. 2: Perfekt = Verb + lassen.", de: "Bed. 2: Perfekt = Verb + lassen." } },
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

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--surface2)", borderRadius: 8, padding: 3, border: "1px solid var(--border)" }}>
      {(["ua", "de"] as Lang[]).map(l => (
        <button key={l} onClick={() => setLang(l)}
          style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: lang === l ? "var(--accent)" : "transparent", color: lang === l ? "#fff" : "var(--muted)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "var(--sans)", transition: "all 0.15s", letterSpacing: "0.04em" }}>
          {l === "ua" ? "🇺🇦 UA" : "🇩🇪 DE"}
        </button>
      ))}
    </div>
  );
}

function MeaningCard({ m, lang }: { m: typeof meanings[0]; lang: Lang }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: m.color, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, display: "inline-block" }} />
        {m.tag[lang]}
      </div>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: 10 }}>{m.num}. {m.title[lang]}</h3>
      {m.examples.map((e, i) => (
        <div key={i}>
          <div style={{ fontSize: "0.82rem", color: "var(--accent)", fontStyle: "italic", lineHeight: 1.5 }}>{e.de}</div>
          <div style={{ fontSize: "0.77rem", color: "var(--muted)", marginBottom: 4 }}>{lang === "ua" ? e.ua : "→ " + e.de}</div>
        </div>
      ))}
      <span style={{ display: "inline-block", marginTop: 10, fontSize: "0.68rem", fontFamily: "var(--mono)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 8px", color: "var(--yellow)" }}>
        Perfekt: {m.perfekt}
      </span>
    </div>
  );
}

function QuizSection({ questions, mode, lang, t }: { questions: typeof quizQuestions; mode: QuizMode; lang: Lang; t: UIStrings }) {
  const [shuffled, setShuffled] = useState<typeof questions>([]);
  const [opts, setOpts] = useState<string[][]>([]);
  const [idx, setIdx] = useState(0);
  const [ok, setOk] = useState(0);
  const [bad, setBad] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    const s = shuffle(questions);
    setShuffled(s);
    setOpts(s.map(q => shuffle(q.options[lang])));
    setIdx(0); setOk(0); setBad(0); setChosen(null); setDone(false);
  }, [questions, lang]);

  if (shuffled.length === 0) return <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>{t.loading}</div>;

  const q = shuffled[idx];
  const total = shuffled.length;
  const pct = Math.round((ok / total) * 100);

  function select(opt: string) {
    if (chosen) return;
    setChosen(opt);
    if (opt === q.correct[lang]) setOk(v => v + 1);
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
      if (data.ok) { setSaved(true); setSaveStatus("ok"); if (data.rank) setMyRank(data.rank); }
      else setSaveStatus("err");
    } catch { setSaveStatus("err"); }
  }

  function restart() {
    const s = shuffle(questions);
    setShuffled(s);
    setOpts(s.map(q => shuffle(q.options[lang])));
    setIdx(0); setOk(0); setBad(0); setChosen(null);
    setDone(false); setSaved(false); setSaveName(""); setSaveStatus("idle"); setMyRank(null);
  }

  if (done) {
    const emoji = pct >= 80 ? "🏆" : pct >= 50 ? "💪" : "📚";
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>{emoji}</div>
        <h2 style={{ fontSize: "1.4rem", marginBottom: 8 }}>{t.resultMsg(pct)}</h2>
        <p style={{ color: "var(--muted)", marginBottom: 28 }}>{t.resultScore(ok, total, pct)}</p>
        {!saved ? (
          <div style={{ maxWidth: 360, margin: "0 auto 24px", textAlign: "left" as const }}>
            <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 8, textAlign: "center" as const }}>{t.saveName}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={saveName} onChange={e => setSaveName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveScore()} placeholder={t.namePlaceholder} maxLength={30}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 9, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: "0.9rem", outline: "none" }} />
              <button onClick={saveScore} disabled={saveStatus === "saving" || !saveName.trim()}
                style={{ padding: "10px 18px", borderRadius: 9, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", opacity: saveStatus === "saving" ? 0.6 : 1 }}>
                {saveStatus === "saving" ? "…" : t.save}
              </button>
            </div>
            {saveStatus === "err" && <div style={{ color: "var(--red)", fontSize: "0.78rem", marginTop: 6 }}>{t.saveErr}</div>}
          </div>
        ) : (
          <div style={{ background: "rgba(52,211,153,0.1)", border: "1px solid var(--green)", borderRadius: 10, padding: "12px 20px", maxWidth: 360, margin: "0 auto 24px", color: "var(--green)", fontSize: "0.88rem" }}>
            {t.saved(myRank)}
          </div>
        )}
        <button onClick={restart} style={{ padding: "11px 24px", borderRadius: 10, background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)", fontSize: "0.9rem", cursor: "pointer" }}>
          {t.restart}
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 28px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.75rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>
        <span>✓ <span style={{ color: "var(--green)" }}>{ok}</span> &nbsp; ✗ <span style={{ color: "var(--red)" }}>{bad}</span></span>
        <span>{t.quizCounter(idx + 1, total)}</span>
      </div>
      <div style={{ width: "100%", height: 3, background: "var(--border)", borderRadius: 99, marginBottom: 22, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg, var(--accent), var(--accent2))", width: `${(idx / total) * 100}%`, transition: "width 0.4s" }} />
      </div>
      <div style={{ fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.5, marginBottom: 22, minHeight: 52 }}>{q.q[lang]}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {opts[idx] && opts[idx].map(opt => {
          let bg = "var(--surface2)", borderColor = "var(--border)", color = "var(--text)";
          if (chosen) {
            if (opt === q.correct[lang]) { bg = "rgba(52,211,153,0.1)"; borderColor = "var(--green)"; color = "var(--green)"; }
            else if (opt === chosen) { bg = "rgba(248,113,113,0.1)"; borderColor = "var(--red)"; color = "var(--red)"; }
          }
          return (
            <button key={opt} onClick={() => select(opt)} disabled={!!chosen}
              style={{ padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${borderColor}`, background: bg, color, fontSize: "0.84rem", cursor: chosen ? "default" : "pointer", textAlign: "left" as const, lineHeight: 1.4, transition: "all 0.15s" }}>
              {opt}
            </button>
          );
        })}
      </div>
      {chosen && (
        <div style={{ borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: "0.83rem", lineHeight: 1.5, background: chosen === q.correct[lang] ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${chosen === q.correct[lang] ? "var(--green)" : "var(--red)"}`, color: chosen === q.correct[lang] ? "var(--green)" : "var(--red)" }}>
          {chosen === q.correct[lang] ? t.correct : t.wrong}
          <div style={{ color: "var(--text)", marginTop: 5, fontSize: "0.79rem" }}>{q.explanation[lang]}</div>
        </div>
      )}
      {chosen && (
        <button onClick={next} style={{ width: "100%", padding: 12, borderRadius: 10, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
          {t.next}
        </button>
      )}
    </div>
  );
}

function BuilderSection({ lang, t }: { lang: Lang; t: UIStrings }) {
  const [idx, setIdx] = useState(0);
  const [val, setVal] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "bad" | "skip">("idle");
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ex = sbExercises[idx];

  function check() {
    setStatus(ex.answers.some(a => normalize(a) === normalize(val)) ? "ok" : "bad");
  }
  function next() {
    if (idx + 1 >= sbExercises.length) setDone(true);
    else { setIdx(i => i + 1); setVal(""); setStatus("idle"); setTimeout(() => inputRef.current?.focus(), 50); }
  }

  if (done) return (
    <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--surface)", borderRadius: 16, border: "1px solid var(--border)" }}>
      <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎉</div>
      <h2 style={{ marginBottom: 8 }}>{t.allDone}</h2>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>{t.allDoneMsg(sbExercises.length)}</p>
      <button onClick={() => { setIdx(0); setVal(""); setStatus("idle"); setDone(false); }}
        style={{ padding: "11px 24px", borderRadius: 10, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
        {t.restart}
      </button>
    </div>
  );

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
      <div style={{ fontSize: "0.73rem", color: "var(--muted)", fontFamily: "var(--mono)", marginBottom: 16 }}>{t.taskCounter(idx + 1, sbExercises.length)}</div>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "var(--accent2)", marginBottom: 6 }}>{t.taskLabel}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 18 }}>{ex.prompt[lang]}</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" as const }}>
        <input ref={inputRef} value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && status === "idle" && check()}
          placeholder={t.inputPlaceholder}
          style={{ flex: 1, minWidth: 200, padding: "12px 16px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface2)", color: "var(--text)", fontSize: "0.9rem", outline: "none" }} />
        {status === "idle" && (
          <button onClick={check} style={{ padding: "12px 22px", borderRadius: 10, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}>
            {t.check}
          </button>
        )}
      </div>
      {status === "idle" && (
        <button onClick={() => setStatus("skip")} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--yellow)", fontSize: "0.8rem", cursor: "pointer", marginBottom: 14 }}>
          {t.hint}
        </button>
      )}
      {status === "skip" && (
        <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid var(--yellow)", borderRadius: 10, padding: "12px 16px", fontSize: "0.83rem", color: "var(--yellow)", marginBottom: 14 }}>
          💡 {ex.hint[lang]}
        </div>
      )}
      {(status === "ok" || status === "bad") && (
        <div style={{ background: status === "ok" ? "rgba(52,211,153,0.08)" : "rgba(248,113,153,0.08)", border: `1px solid ${status === "ok" ? "var(--green)" : "var(--red)"}`, borderRadius: 10, padding: "12px 16px", fontSize: "0.83rem", color: status === "ok" ? "var(--green)" : "var(--red)", marginBottom: 14 }}>
          {status === "ok" ? t.greatAnswer : t.wrongAnswer}
          <div style={{ fontFamily: "var(--mono)", color: "var(--text)", marginTop: 5, fontSize: "0.8rem" }}>{ex.answers[0]}</div>
          <div style={{ color: "var(--muted)", marginTop: 4, fontSize: "0.77rem" }}>{ex.explanation[lang]}</div>
        </div>
      )}
      {status !== "idle" && (
        <button onClick={next} style={{ width: "100%", padding: 12, borderRadius: 10, background: "var(--accent)", color: "#fff", border: "none", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
          {t.next}
        </button>
      )}
    </div>
  );
}

function LeaderboardSection({ t }: { t: UIStrings }) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true); setError(false);
    try {
      const res = await fetch("/api/scores");
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch { setError(true); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{t.leaderTitle}</h2>
        <button onClick={load} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--muted)", fontSize: "0.78rem", cursor: "pointer" }}>
          {t.leaderRefresh}
        </button>
      </div>
      {loading && <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>{t.loading}</div>}
      {error && <div style={{ textAlign: "center", color: "var(--red)", padding: 40 }}>{t.leaderErr}</div>}
      {!loading && !error && data.length === 0 && <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>{t.leaderEmpty}</div>}
      {!loading && data.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.map((entry, i) => {
            const displayName = entry.name.includes("__") ? entry.name.split("__")[0] : entry.name;
            const modeTag = entry.name.includes("__") ? entry.name.split("__")[1] : "";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10, background: i < 3 ? "var(--surface2)" : "transparent", border: i < 3 ? "1px solid var(--border)" : "1px solid transparent" }}>
                <span style={{ fontSize: i < 3 ? "1.4rem" : "0.9rem", minWidth: 32, textAlign: "center" as const, color: "var(--muted)", fontFamily: "var(--mono)" }}>{i < 3 ? medals[i] : `#${entry.rank}`}</span>
                <span style={{ flex: 1, fontWeight: i === 0 ? 700 : 400 }}>{displayName}</span>
                {modeTag && <span style={{ fontSize: "0.65rem", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 7px", color: "var(--muted)", fontFamily: "var(--mono)" }}>{modeTag}</span>}
                <span style={{ fontFamily: "var(--mono)", fontWeight: 700, color: i === 0 ? "var(--yellow)" : "var(--accent)", fontSize: "0.95rem" }}>{entry.score} pts</span>
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
  const [lang, setLang] = useState<Lang>("ua");
  const t = UI[lang];

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--sans)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 60px" }}>
      <header style={{ width: "100%", maxWidth: 860, padding: "24px 0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ fontFamily: "var(--mono)", fontSize: "1.5rem", color: "var(--accent)", letterSpacing: "-0.5px" }}>lassen</h1>
          <span style={{ fontSize: "0.75rem", color: "var(--muted)", background: "var(--surface2)", padding: "2px 10px", borderRadius: 99, border: "1px solid var(--border)" }}>{t.subtitle}</span>
        </div>
        <LangToggle lang={lang} setLang={setLang} />
      </header>

      <div style={{ display: "flex", gap: 6, width: "100%", maxWidth: 860, marginBottom: 24, flexWrap: "wrap" as const }}>
        {t.tabs.map((label, i) => {
          const id = t.tabIds[i];
          return (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding: "7px 16px", borderRadius: 8, border: `1px solid ${tab === id ? "var(--accent)" : "var(--border)"}`, background: tab === id ? "var(--accent)" : "var(--surface)", color: tab === id ? "#fff" : "var(--muted)", fontSize: "0.8rem", cursor: "pointer", fontWeight: tab === id ? 600 : 400, transition: "all 0.15s" }}>
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ width: "100%", maxWidth: 860 }}>
        {tab === "meanings" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {meanings.map(m => <MeaningCard key={m.num} m={m} lang={lang} />)}
          </div>
        )}
        {tab === "quiz" && <QuizSection key={`quiz-${lang}`} questions={quizQuestions} mode="quiz" lang={lang} t={t} />}
        {tab === "builder" && <BuilderSection key={`builder-${lang}`} lang={lang} t={t} />}
        {tab === "perfekt" && <QuizSection key={`perfekt-${lang}`} questions={perfektQuestions} mode="perfekt" lang={lang} t={t} />}
        {tab === "leaderboard" && <LeaderboardSection t={t} />}
      </div>
    </div>
  );
}
