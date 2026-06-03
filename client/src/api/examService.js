// Exam + submission service classes.
// In P3 they no longer touch the data layer directly. They delegate every
// data call to the ApiGateway, which decides whether to hit the in-memory
// MockDb or the real Express server based on Config.dataMode.
// React components do not change — they keep calling these services
// through the ServicesContext.

// שירותי הבחינות וההגשות.
// אחרי שינוי P3-M2, השירותים הם רק "מתאמים דקים" מעל ApiGateway:
// מחזיקים את הצד-לוגיקה (כמו logger.info בעת יצירת בחינה) אבל לא
// ניגשים יותר ישירות ל-MockDb. כך, מצב mock ו-http חולקים את אותו
// קוד שירות.

export class ExamService {
  constructor({ gateway, logger }) {
    this.gateway = gateway;
    this.logger = logger?.child('examService');
  }

  listAll()                  { return this.gateway.listAllExams(); }
  listPublished()            { return this.gateway.listPublishedExams(); }
  listByTeacher(teacherId)   { return this.gateway.listExamsByTeacher(teacherId); }
  getById(id)                { return this.gateway.getExam(id); }
  create(payload)            { this.logger?.info('create exam', payload?.title); return this.gateway.createExam(payload); }
  update(id, patch)          { return this.gateway.updateExam(id, patch); }
  setStatus(id, status)      { return this.gateway.setExamStatus(id, status); }
  remove(id)                 { return this.gateway.removeExam(id); }
}

export class SubmissionService {
  constructor({ gateway, logger }) {
    this.gateway = gateway;
    this.logger = logger?.child('submissionService');
  }

  listByStudent(studentId)   { return this.gateway.listSubmissionsByStudent(studentId); }
  listByExam(examId)         { return this.gateway.listSubmissionsByExam(examId); }
  submit(payload)            { this.logger?.info('submit exam', payload?.examId); return this.gateway.submitExam(payload); }
}
