import { mockExams } from './mockDb';

// פונקציה שמדמה שליפת כל הבחינות מהשרת.
// משתמשים ב-Promise וב-setTimeout כדי לדמות זמן טעינה של רשת.
export const getAllExams = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockExams]);
    }, 500);
  });
};

// פונקציה שמדמה שליפת בחינה ספציפית לפי ID מהשרת.
// אם הבחינה לא נמצאה, מוחזרת שגיאה.
export const getExamById = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exam = mockExams.find(e => e.id === id);
      if (exam) {
        resolve({ ...exam });
      } else {
        reject(new Error("Exam not found"));
      }
    }, 500);
  });
};

// פונקציה שמדמה יצירת בחינה חדשה ושליחתה לשרת.
// מוקצה ID חדש לבחינה ומתווספת למערך הבחינות המדומה.
export const createExam = (exam) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newExam = { ...exam, id: Date.now().toString() };
      mockExams.push(newExam);
      resolve(newExam);
    }, 500);
  });
};
