import api from './api';

export const fetchLecturerStatistics = () =>
  api.get('/lecturer/statistics');

export const fetchLecturerExamStatistics = (examId) =>
  api.get(`/lecturer/exams/${examId}/statistics`);

export const fetchAdminStatistics = () =>
  api.get('/admin/statistics');