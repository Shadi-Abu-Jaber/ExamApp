import {
  BarChart3,
  BookOpen,
  ClipboardList,
  FilePlus2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const roleLinks = {
  ADMIN: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Exams', to: '/admin/exams', icon: ClipboardList },
  ],
  LECTURER: [
  { label: 'Dashboard', to: '/lecturer/dashboard', icon: LayoutDashboard },
  { label: 'My Exams', to: '/lecturer/exams', icon: ClipboardList },
  { label: 'Create Exam', to: '/lecturer/exams/create', icon: FilePlus2 },
  { label: 'AI Tools', to: '/lecturer/ai-tools', icon: Sparkles },
],
  STUDENT: [
    { label: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Available Exams', to: '/student/exams', icon: BookOpen },
    { label: 'My Results', to: '/student/results', icon: Trophy },
  ],
};

const roleTheme = {
  ADMIN: {
    label: 'Administrator',
    badge: 'bg-red-50 text-red-700 ring-red-100',
    icon: Users,
  },
  LECTURER: {
    label: 'Lecturer',
    badge: 'bg-blue-50 text-blue-700 ring-blue-100',
    icon: GraduationCap,
  },
  STUDENT: {
    label: 'Student',
    badge: 'bg-green-50 text-green-700 ring-green-100',
    icon: BookOpen,
  },
};

const Sidebar = ({ links }) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navigationLinks = links?.length ? links : roleLinks[user?.role] || [];
  const theme = roleTheme[user?.role] || roleTheme.STUDENT;
  const RoleIcon = theme.icon;

  const isActive = (path) => {
    if (path === '/lecturer/exams') {
      return (
        location.pathname === '/lecturer/exams' ||
        location.pathname.startsWith('/lecturer/exams/') &&
          location.pathname !== '/lecturer/exams/create'
      );
    }

    return location.pathname === path;
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200/70 bg-white/90 px-4 py-5 shadow-sm backdrop-blur-xl lg:block">
      <div className="mb-7 rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <BarChart3 className="h-6 w-6" />
          </div>

          <div>
            <div className="text-2xl font-black tracking-tight">ExamFlow</div>
            <div className="text-xs text-blue-100">Smart exam platform</div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
              <RoleIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {user?.fullName || 'User'}
              </div>
              <div className="truncate text-xs text-blue-100">
                {user?.email || user?.role}
              </div>
            </div>
          </div>

          {user?.role && (
            <div
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${theme.badge}`}
            >
              {theme.label}
            </div>
          )}
        </div>
      </div>

      <nav className="space-y-1.5">
        {navigationLinks.map((link) => {
          const active = isActive(link.to);
          const Icon = link.icon || LayoutDashboard;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                }`}
              />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-5 left-4 right-4 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;