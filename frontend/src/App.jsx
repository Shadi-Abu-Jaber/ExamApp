import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/Layout/DashboardLayout';

import Login from './pages/Login';
import Register from './pages/Register';

import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import AdminExamsPage from './pages/admin/ExamsPage';

import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import LecturerExamsPage from './pages/lecturer/ExamList';
import LecturerExamForm from './pages/lecturer/ExamForm';
import LecturerExamQuestions from './pages/lecturer/ExamQuestions';
import LecturerSubmissions from './pages/lecturer/ExamSubmissions';
import GradeSubmission from './pages/lecturer/GradeSubmission';
import AiTools from './pages/lecturer/AiTools';
import ExamMonitor from './pages/lecturer/ExamMonitor';
import LecturerAnalytics from './pages/lecturer/LecturerAnalytics';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentExamsPage from './pages/student/ExamList';
import StudentExamStart from './pages/student/ExamStart';
import StudentResults from './pages/student/StudentResults';
import ResultDetail from './pages/student/ResultDetail';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/exams', label: 'Exams' },
];

const lecturerLinks = [
  { to: '/lecturer/dashboard', label: 'Dashboard' },
  { to: '/lecturer/exams', label: 'My Exams' },
  { to: '/lecturer/exams/create', label: 'Create Exam' },
  { to: '/lecturer/ai-tools', label: 'AI Tools' },
  { to: '/lecturer/analytics', label: 'Analytics' },
];

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard' },
  { to: '/student/exams', label: 'Available Exams' },
  { to: '/student/results', label: 'My Results' },
];

const HomeRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === 'LECTURER') {
    return <Navigate to="/lecturer/dashboard" replace />;
  }

  return <Navigate to="/student/dashboard" replace />;
};

const withProtectedLayout = (roles, links, element) => (
  <ProtectedRoute roles={roles}>
    <DashboardLayout links={links}>{element}</DashboardLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={withProtectedLayout(
              ['ADMIN'],
              adminLinks,
              <AdminDashboard />
            )}
          />

          <Route
            path="/admin/users"
            element={withProtectedLayout(
              ['ADMIN'],
              adminLinks,
              <UsersPage />
            )}
          />

          <Route
            path="/admin/exams"
            element={withProtectedLayout(
              ['ADMIN'],
              adminLinks,
              <AdminExamsPage />
            )}
          />

          {/* Lecturer routes */}
          <Route
            path="/lecturer/dashboard"
            element={withProtectedLayout(
              ['LECTURER'],
              lecturerLinks,
              <LecturerDashboard />
            )}
          />

          <Route
            path="/lecturer/exams"
            element={withProtectedLayout(
              ['LECTURER'],
              lecturerLinks,
              <LecturerExamsPage />
            )}
          />

          <Route
            path="/lecturer/exams/create"
            element={withProtectedLayout(
              ['LECTURER'],
              lecturerLinks,
              <LecturerExamForm />
            )}
          />

          <Route
            path="/lecturer/exams/:id/edit"
            element={withProtectedLayout(
              ['LECTURER'],
              lecturerLinks,
              <LecturerExamForm />
            )}
          />

          <Route
            path="/lecturer/exams/:id/questions"
            element={withProtectedLayout(
              ['LECTURER'],
              lecturerLinks,
              <LecturerExamQuestions />
            )}
          />

          <Route
            path="/lecturer/exams/:id/submissions"
            element={withProtectedLayout(
              ['LECTURER'],
              lecturerLinks,
              <LecturerSubmissions />
            )}
          />

          <Route
            path="/lecturer/exams/:id/monitor"
            element={withProtectedLayout(
              ['LECTURER'],
              lecturerLinks,
              <ExamMonitor />
            )}
          />

          <Route
            path="/lecturer/submissions/:id/grade"
            element={withProtectedLayout(
              ['LECTURER'],
              lecturerLinks,
              <GradeSubmission />
            )}
          />

          <Route
            path="/lecturer/ai-tools"
            element={withProtectedLayout(
              ['LECTURER'],
              lecturerLinks,
              <AiTools />
            )}
          />

          <Route
            path="/lecturer/analytics"
            element={withProtectedLayout(
              ['LECTURER'],
              lecturerLinks,
              <LecturerAnalytics />
            )}
          />

          {/* Student routes */}
          <Route
            path="/student/dashboard"
            element={withProtectedLayout(
              ['STUDENT'],
              studentLinks,
              <StudentDashboard />
            )}
          />

          <Route
            path="/student/exams"
            element={withProtectedLayout(
              ['STUDENT'],
              studentLinks,
              <StudentExamsPage />
            )}
          />

          <Route
            path="/student/exams/:id/start"
            element={withProtectedLayout(
              ['STUDENT'],
              studentLinks,
              <StudentExamStart />
            )}
          />

          <Route
            path="/student/results"
            element={withProtectedLayout(
              ['STUDENT'],
              studentLinks,
              <StudentResults />
            )}
          />

          <Route
            path="/student/results/:id"
            element={withProtectedLayout(
              ['STUDENT'],
              studentLinks,
              <ResultDetail />
            )}
          />

          <Route
            path="*"
            element={
              <div className="flex min-h-screen items-center justify-center bg-slate-50 p-12 text-center">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Page not found
                  </h1>
                  <p className="mt-2 text-slate-500">
                    The page you are looking for does not exist.
                  </p>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;