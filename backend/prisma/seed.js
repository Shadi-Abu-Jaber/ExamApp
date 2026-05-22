const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordAdmin = await bcrypt.hash('Admin123!', 10);
  const passwordLecturer = await bcrypt.hash('Lecturer123!', 10);
  const passwordStudent = await bcrypt.hash('Student123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@examflow.com' },
    update: {},
    create: {
      fullName: 'Admin User',
      email: 'admin@examflow.com',
      passwordHash: passwordAdmin,
      role: 'ADMIN',
    },
  });

  const lecturer = await prisma.user.upsert({
    where: { email: 'lecturer@examflow.com' },
    update: {},
    create: {
      fullName: 'Lecturer User',
      email: 'lecturer@examflow.com',
      passwordHash: passwordLecturer,
      role: 'LECTURER',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@examflow.com' },
    update: {},
    create: {
      fullName: 'Student User',
      email: 'student@examflow.com',
      passwordHash: passwordStudent,
      role: 'STUDENT',
    },
  });

  const exam = await prisma.exam.upsert({
    where: { id: 'exam-demo-1' },
    update: {},
    create: {
      id: 'exam-demo-1',
      title: 'Intro to ExamFlow',
      description: 'A sample exam with mixed question types.',
      lecturerId: lecturer.id,
      durationMinutes: 30,
      startTime: new Date(Date.now() - 1000 * 60 * 5),
      endTime: new Date(Date.now() + 1000 * 60 * 25),
      status: 'PUBLISHED',
      resultsPublished: false,
    },
  });

  await prisma.question.upsert({
    where: { id: 'question-demo-1' },
    update: {},
    create: {
      id: 'question-demo-1',
      examId: exam.id,
      questionText: 'What does ExamFlow do?',
      questionType: 'MCQ',
      points: 5,
      orderIndex: 1,
      options: {
        create: [
          { optionText: 'Manages online exams', isCorrect: true },
          { optionText: 'Creates invoices', isCorrect: false },
          { optionText: 'Resolves network issues', isCorrect: false },
        ],
      },
    },
  });

  await prisma.question.upsert({
    where: { id: 'question-demo-2' },
    update: {},
    create: {
      id: 'question-demo-2',
      examId: exam.id,
      questionText: 'React is a programming language.',
      questionType: 'TRUE_FALSE',
      points: 5,
      orderIndex: 2,
      options: {
        create: [
          { optionText: 'True', isCorrect: false },
          { optionText: 'False', isCorrect: true },
        ],
      },
    },
  });

  await prisma.question.upsert({
    where: { id: 'question-demo-3' },
    update: {},
    create: {
      id: 'question-demo-3',
      examId: exam.id,
      questionText: 'Describe one benefit of using Prisma.',
      questionType: 'SHORT_TEXT',
      points: 5,
      orderIndex: 3,
    },
  });

  // Essay question
  await prisma.question.upsert({
    where: { id: 'question-demo-4' },
    update: {},
    create: {
      id: 'question-demo-4',
      examId: exam.id,
      questionText: 'Write a short essay on the importance of testing in software development.',
      questionType: 'ESSAY',
      points: 10,
      orderIndex: 4,
    },
  });

  await prisma.examStudent.upsert({
    where: { id: 'assignment-student-demo' },
    update: { studentId: student.id, examId: exam.id },
    create: {
      id: 'assignment-student-demo',
      examId: exam.id,
      studentId: student.id,
    },
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
