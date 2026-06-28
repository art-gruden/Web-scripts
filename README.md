# Lassen Trainer — інтеграція в Next.js + Vercel + Upstash

## Структура файлів для додавання в проєкт

```
твій-проєкт/
├── app/
│   ├── api/
│   │   └── scores/
│   │       └── route.ts          ← API endpoint (GET + POST)
│   └── trainer/
│       ├── layout.tsx            ← layout з CSS
│       ├── trainer.css           ← CSS змінні + шрифти
│       └── page.tsx              ← весь тренажер (React компонент)
```

Тренажер буде доступний за адресою: `https://твій-домен.vercel.app/trainer`

---

## Крок 1 — Встановити пакет Upstash

```bash
npm install @upstash/redis
```

---

## Крок 2 — Підключити Upstash до Vercel

### Варіант A (рекомендований — через Vercel Dashboard)

1. Відкрий `vercel.com` → твій проєкт → вкладка **Storage**
2. Натисни **Connect Store** → вибери **Upstash KV (Redis)**
3. Vercel автоматично створить Redis-базу і пропише змінні оточення:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Натисни **Redeploy** щоб змінні набули сили

### Варіант B (через Marketplace)

Відкрий: `vercel.com/marketplace/upstash` → Install → вибери свій проєкт

---

## Крок 3 — Локальна розробка

Після підключення через Dashboard, підтяни змінні локально:

```bash
vercel env pull .env.local
```

Тепер локально також буде підключення до тієї ж Redis-бази.

---

## Крок 4 — Скопіювати файли

Скопіюй файли з цього архіву у відповідні папки свого проєкту:

| Файл | Куди класти |
|------|------------|
| `app/api/scores/route.ts` | `app/api/scores/route.ts` |
| `app/trainer/page.tsx` | `app/trainer/page.tsx` |
| `app/trainer/layout.tsx` | `app/trainer/layout.tsx` |
| `app/trainer/trainer.css` | `app/trainer/trainer.css` |

**Важливо:** якщо в тебе вже є `globals.css` з CSS reset — перенеси туди
`:root { --bg: ...; }` змінні з `trainer.css`, щоб не дублювати.

---

## Крок 5 — Деплой

```bash
git add .
git commit -m "add lassen trainer with leaderboard"
git push
```

Vercel автоматично задеплоїть. Відкрий `https://твій-домен.vercel.app/trainer`

---

## Як працює збереження результатів

### API endpoint: `POST /api/scores`

```json
// Request body
{ "name": "Dima", "score": 10, "mode": "quiz" }

// Response
{ "ok": true, "rank": 3 }
```

- Якщо той самий `name + mode` вже є в таблиці — оновлює тільки якщо новий score **вищий** (`GT` режим Redis)
- `mode` може бути `"quiz"` або `"perfekt"` — одна людина має окремий запис для кожного режиму

### API endpoint: `GET /api/scores`

```json
// Response — топ-20, відсортовано від найвищого
[
  { "name": "Dima__quiz", "score": 11, "rank": 1 },
  { "name": "Anna__perfekt", "score": 8, "rank": 2 }
]
```

В UI `__mode` суфікс прибирається автоматично.

### Redis структура

Використовується **Sorted Set** (`ZADD`):
- Ключ: `lassen:leaderboard`
- Member: `"Dima__quiz"` (ім'я + режим)
- Score: кількість правильних відповідей

---

## Можливі проблеми

### `Redis.fromEnv()` кидає помилку
Переконайся що є `.env.local` з:
```
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=AX...
```

### Таблиця лідерів показує помилку на продакшні
Перевір у Vercel Dashboard → Settings → Environment Variables що обидві змінні є.

### TypeScript помилки в route.ts
Якщо версія `@upstash/redis` < 1.28, параметр `gt: true` може не підтримуватись.
Заміни `zadd` на:
```typescript
const existing = await redis.zscore(KEY, member);
if (existing === null || score > existing) {
  await redis.zadd(KEY, { score, member });
}
```
