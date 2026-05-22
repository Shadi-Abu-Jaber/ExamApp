import api from './api';

export const fetchQuestions = (examId) => api.get(`/exams/${examId}/questions`);
export const createQuestion = (examId, payload) => api.post(`/exams/${examId}/questions`, payload);
export const updateQuestion = (id, payload) => api.patch(`/questions/${id}`, payload);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);
