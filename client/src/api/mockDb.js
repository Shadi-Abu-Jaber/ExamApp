// זהו מסד נתונים מדומה (mock) לבחינות ולציוני סטודנטים.
// כאן נשמור את המידע שלנו באופן זמני, כאילו הוא מגיע משרת אמיתי.

// מערך של בחינות לדוגמה. כל בחינה כוללת ID, כותרת ומערך של שאלות.
export const mockExams = [
  {
    id: "1",
    title: "JavaScript Basics",
    questions: [
      { id: "q1", text: "What is a closure?", options: ["A function with its lexical environment", "A type of loop", "A CSS property"], answer: 0 },
      { id: "q2", text: "Which keyword defines a constant?", options: ["var", "let", "const"], answer: 2 }
    ]
  },
  {
    id: "2",
    title: "React Fundamentals",
    questions: [
      { id: "q3", text: "What is JSX?", options: ["JavaScript XML", "Java Syntax Extension", "JSON XML"], answer: 0 },
      { id: "q4", text: "Which hook handles side effects?", options: ["useState", "useEffect", "useMemo"], answer: 1 }
    ]
  }
];

// מערך של ציוני סטודנטים לדוגמה. כל ציון מקושר לסטודנט ולבחינה.
export const mockStudentScores = [
  { studentId: "s1", examId: "1", score: 85 },
  { studentId: "s2", examId: "1", score: 92 }
];
