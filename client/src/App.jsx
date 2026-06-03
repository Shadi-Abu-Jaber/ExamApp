import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NavigationMenu from './components/NavigationMenu.jsx';
import ToastViewport from './components/ToastViewport.jsx';
import HomePage from './pages/HomePage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import { ServicesProvider, useServices } from './context/ServicesContext.jsx';

function AppShell() {
  const { storage, notify } = useServices();
  const [user, setUser] = useState(() => storage.get('current_user'));

  const handleLogout = () => {
    storage.remove('current_user');
    setUser(null);
    notify.info('יצאת מהמערכת');
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column" dir="rtl">
      <NavigationMenu user={user} onLogout={handleLogout} />
      <ToastViewport />

      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route path="/login" element={<PlaceholderPage title="כניסה" note="יוטמע במודול האימות." />} />
          <Route path="/register" element={<PlaceholderPage title="הרשמה" note="יוטמע במודול האימות." />} />
          <Route path="/teacher/*" element={<PlaceholderPage title="אזור מורה" note="יוטמע במודול המורים." />} />
          <Route path="/student/*" element={<PlaceholderPage title="אזור תלמיד" note="יוטמע במודול התלמידים." />} />
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
      <AppShell />
    </ServicesProvider>
  );
}
