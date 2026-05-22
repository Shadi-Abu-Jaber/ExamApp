import api from './api';

export const fetchSubmissions = (examId) => api.get(`/lecturer/exams/${examId}/submissions`);
export const fetchSubmission = (id) => api.get(`/submissions/${id}`);
export const gradeAnswer = (id, payload) => api.patch(`/answers/${id}/grade`, payload);
export const gradeSubmission = (id, payload) => api.patch(`/submissions/${id}/grade`, payload);
export const publishGrade = (id) => api.post(`/submissions/${id}/publish-grade`);
