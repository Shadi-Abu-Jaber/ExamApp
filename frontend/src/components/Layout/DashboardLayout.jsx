import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const DashboardLayout = ({ children, links }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fafc_32%,#f8fafc_100%)] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar links={links} />

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-lg font-black text-slate-950">ExamFlow</div>
                <div className="text-xs text-slate-500">
                  {user?.role || 'Dashboard'}
                </div>
              </div>

              <button
                type="button"
                className="rounded-2xl bg-slate-100 p-2 text-slate-700"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;