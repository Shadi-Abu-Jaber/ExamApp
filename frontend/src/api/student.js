import api from './api';

export const fetchAssignedExams = () => api.get('/student/exams');
export const startExam = (examId) => api.post(`/student/exams/${examId}/start`);
export const getSubmission = (submissionId) => api.get(`/student/submissions/${submissionId}`);
export const saveAnswer = (submissionId, payload) => api.post(`/student/submissions/${submissionId}/answers/autosave`, payload);
export const submitExam = (submissionId) => api.post(`/student/submissions/${submissionId}/submit`);
export const fetchExamQuestions = (examId) => api.get(`/exams/${examId}/questions`);
export const fetchResults = () => api.get('/student/results');
export const fetchResult = (examId) => api.get(`/student/results/${examId}`);
