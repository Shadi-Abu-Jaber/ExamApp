// קומפוננטת השורש של האפליקציה.
// אחראית על: הספקת השירותים לעץ הרכיבים, הצגת תפריט הניווט והוטסטים,
// וניתוב בין העמודים השונים. מצב המשתמש מנוהל ב-AuthContext.

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NavigationMenu from './components/NavigationMenu.jsx';
import ToastViewport from './components/ToastViewport.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import TeacherRoutes from './pages/teacher/TeacherRoutes.jsx';
import { ServicesProvider } from './context/ServicesContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-vh-100 bg-light d-flex flex-column" dir="rtl">
      <NavigationMenu user={user} onLogout={logout} />
      <ToastViewport />

      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute role="teacher">
                <TeacherRoutes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/*"
            element={
              <ProtectedRoute role="student">
                <PlaceholderPage title="אזור תלמיד" note="יוטמע במודול התלמידים (M4)." />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="py-3 bg-white border-top text-center text-muted small">
        &copy; 2026 מערכת בחינות אלקטרונית
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ServicesProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ServicesProvider>
  );
}
