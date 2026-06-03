import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentDashboard from './StudentDashboard.jsx';
import AvailableExamsPage from './AvailableExamsPage.jsx';
import ExamTakerPage from './ExamTakerPage.jsx';
import ResultsPage from './ResultsPage.jsx';

export default function StudentRoutes() {
  return (
    <Routes>
      <Route index element={<StudentDashboard />} />
      <Route path="exams" element={<AvailableExamsPage />} />
      <Route path="exams/:id/take" element={<ExamTakerPage />} />
      <Route path="results" element={<ResultsPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
