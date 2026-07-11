# ============================================================================
# ExamApp — PostgreSQL image for LOCAL development (Docker as a database).
# ----------------------------------------------------------------------------
# תמונת Postgres מוכנה-להרצה שמשמשת אותנו כבסיס נתונים לוקאלי בזמן פיתוח.
# בונים על גבי התמונה הרשמית postgres:16, מגדירים משתמש/סיסמה/DB דרך ENV,
# ומעתיקים את סקריפטי האתחול לתיקייה /docker-entrypoint-initdb.d/.
#
# כל קובץ *.sql שמונח בתיקייה הזו רץ אוטומטית (בסדר אלפביתי) בפעם הראשונה
# שהקונטיינר עולה עם דאטה ריק:
#   01_schema.sql  → יוצר את הטבלאות users / exams / submissions.
#   02_seed.sql    → מזריע 2 משתמשי דמו + 2 בחינות דמו.
# כך שברגע שהקונטיינר עולה — יש לנו examapp מלא ומוכן לחיבור.
#
# Build:  docker build -t examapp-postgres ./db          (מתוך backend/)
# Run:    docker run --name examapp-pg -p 5432:5432 -d examapp-postgres
# ============================================================================

FROM postgres:16

# פרטי החיבור לבסיס הנתונים בזמן פיתוח לוקאלי.
# הערכים תואמים ל-backend/.env.example (postgres / postgres / examapp),
# כך שהאפליקציה וסקריפט connect-test.js מתחברים ללא שינוי קוד.
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=examapp

# העתקת סקריפטי האתחול. הם ירוצו רק בהעלאה הראשונה (כשה-volume ריק).
# מעתיקים אך ורק סכמה + זרע. הקובץ 03_queries.sql הוא סקריפט הדגמה ידני
# ולכן איננו מעתיקים אותו לכאן.
COPY 01_schema.sql /docker-entrypoint-initdb.d/01_schema.sql
COPY 02_seed.sql   /docker-entrypoint-initdb.d/02_seed.sql

EXPOSE 5432
