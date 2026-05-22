import api from './api';

export const fetchUsers = () => api.get('/users');
export const fetchStudents = () => api.get('/users/students');

export const createUser = (payload) => api.post('/users', payload);
export const updateUser = (id, payload) => api.patch(`/users/${id}`, payload);
export const deleteUser = (id) => api.delete(`/users/${id}`);