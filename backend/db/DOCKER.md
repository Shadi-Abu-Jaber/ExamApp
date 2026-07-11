# ExamApp — Local PostgreSQL with Docker

מדריך להרמת בסיס נתונים לוקאלי (PostgreSQL) באמצעות Docker, בדיוק לפי
הדוגמה שנבנתה בשיעור: Postgres רץ בתוך Docker, וה-Node/Express רץ על ה-host
ומתחבר אליו דרך `localhost:5432`.

---

## שלוש דרכי עבודה עם הנתונים (Data configurations)

הפרויקט תומך בשלוש תצורות. אותם משתני `PG_*` משרתים את כולן — רק הערכים משתנים:

| # | תצורה | מתי משתמשים | איך מפעילים |
|---|--------|-------------|-------------|
| 1 | **JSON לוקאלי** | פיתוח מהיר ללא DB כלל | הלקוח ב-`dataMode: 'mock'` (ברירת מחדל) / השרת עם ה-store בזיכרון (`src/db.js`) |
| 2 | **DATABASE מרוחק** | ענן / DB משותף | ממלאים `PG_HOST` וסיסמה של השרת המרוחק ב-`backend/.env` |
| 3 | **DATABASE לוקאלי (Docker)** | פיתוח מול Postgres אמיתי | `npm run db:up` (ראו למטה) |

> המעבר בין "JSON לוקאלי" ל"שרת" נעשה בצד הלקוח דרך `VITE_DATA_MODE=mock|http`
> (או `localStorage['examapp::dataMode']`). ראו `GEMINI.md`.

---

## דרישות מקדימות

* Docker מותקן ופועל (`docker --version`).
* קובץ `backend/.env` (העתיקו מ-`backend/.env.example`).
* פעם אחת: `cd backend && npm install` (מוריד את חבילת `pg`).

---

## אפשרות א' — Docker Compose (מומלץ)

מתוך תיקיית `backend/`:

```bash
npm run db:up        # docker compose up -d  (בונה את התמונה בפעם הראשונה)
npm run db:test      # node db/connect-test.js — מאמת חיבור + שליפות
npm run db:logs      # לוגים חיים של ה-DB
npm run db:down      # עצירה (הנתונים נשמרים ב-volume)
npm run db:reset     # מחיקת נתונים + הרמה מחדש (מריץ את סקריפטי ה-init שוב)
```

יתרון: `named volume` שומר את הנתונים בין הפעלות, יש `healthcheck`, ופורט
ה-host ניתן להגדרה דרך `PG_PORT`.

---

## אפשרות ב' — Docker "ידני" (כמו בדוגמת השיעור, ללא compose)

מתוך תיקיית `backend/`:

```bash
# 1. בניית התמונה מתוך ./db/Dockerfile
docker build -t examapp-postgres ./db

# 2. הרצת הקונטיינר (מפרסם את הפורט 5432 ל-host)
docker run --name examapp-pg -p 5432:5432 -d examapp-postgres

# 3. בדיקה שהקונטיינר רץ
docker ps

# 4. אימות חיבור + שליפת נתונים מתוך Node
node db/connect-test.js

# עצירה וניקוי
docker stop examapp-pg && docker rm examapp-pg
```

---

## מה קורה בהעלאה הראשונה?

תמונת `postgres:16` מריצה אוטומטית כל קובץ `*.sql` שנמצא ב-
`/docker-entrypoint-initdb.d/` (לפי סדר אלפביתי), אבל **רק כשה-data ריק**:

1. `01_schema.sql` — יוצר את הטבלאות `users` / `exams` / `submissions`
   (עמודת `questions` היא `JSONB` — מודל היברידי).
2. `02_seed.sql` — מזריע 2 משתמשי דמו + 2 בחינות דמו.

לכן ברגע שהקונטיינר עולה, `examapp` כבר מלא ומוכן. כדי להריץ את ה-init
מחדש (למשל אחרי שינוי הסכמה) — `npm run db:reset` (מוחק את ה-volume).

פרטי החיבור המוגדרים בתמונה (תואמים ל-`.env.example`):

```
host=localhost  port=5432  user=postgres  password=postgres  database=examapp
```

---

## פתרון תקלות

* **`port is already allocated` / חיבור נכשל** — כבר רץ Postgres מקומי על 5432.
  הרימו את Docker על פורט אחר:
  ```bash
  PG_PORT=5433 npm run db:up      # ואז עדכנו PG_PORT=5433 ב-backend/.env
  ```
* **שינוי לסכמה לא נתפס** — סקריפטי ה-init רצים רק על data ריק. הריצו
  `npm run db:reset` כדי למחוק את ה-volume ולזרוע מחדש.
* **`password authentication failed`** — ודאו ש-`PG_PASSWORD` ב-`backend/.env`
  תואם לזה של הקונטיינר (ברירת מחדל `postgres`).
