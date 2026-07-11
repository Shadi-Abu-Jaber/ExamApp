// מזהים טקסטואליים לרשומות חדשות. הסכמה מגדירה id כ-TEXT (לא serial),
// כך שהשרת מייצר את המזהה — באותו פורמט שהיה ל-store בזיכרון וללקוח.
export function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
