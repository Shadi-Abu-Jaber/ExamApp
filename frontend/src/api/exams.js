import api from './api';

export const fetchExams = () => api.get('/exams');

export const createExam = (payload) => api.post('/exams', payload);

export const updateExam = (id, payload) => api.patch(`/exams/${id}`, payload);

export const deleteExam = (id) => api.delete(`/exams/${id}`);

export const publishExam = (id) => api.post(`/exams/${id}/publish`);

export const closeExam = (id) => api.post(`/exams/${id}/close`);

export const assignStudents = (id, payload) =>
  api.post(`/exams/${id}/assign-students`, payload);

export const fetchExamMonitor = (id) => api.get(`/exams/${id}/monitor`);