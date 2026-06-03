import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TeacherDashboard from './TeacherDashboard.jsx';
import MyExamsPage from './MyExamsPage.jsx';
import ExamBuilderPage from './ExamBuilderPage.jsx';
import ExamEditorPage from './ExamEditorPage.jsx';

export default function TeacherRoutes() {
  return (
    <Routes>
      <Route index element={<TeacherDashboard />} />
      <Route path="exams" element={<MyExamsPage />} />
      <Route path="exams/new" element={<ExamBuilderPage />} />
      <Route path="exams/:id/edit" element={<ExamEditorPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
