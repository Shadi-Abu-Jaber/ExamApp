import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../../api/api';

import StatCard from '../../components/StatCard';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await api.get('/admin/statistics');
        setStats(res.data);
      } catch (err) {
        setStats(null);
        setError(err.response?.data?.message || 'Unable to load admin statistics.');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        subtitle="System overview, users, exams, and submissions"
      />

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <Card className="flex min-h-[260px] items-center justify-center p-10">
          <LoadingSpinner />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Users" value={stats?.totalUsers ?? 0} />
            <StatCard title="Students" value={stats?.totalStudents ?? 0} />
            <StatCard title="Lecturers" value={stats?.totalLecturers ?? 0} />
            <StatCard title="Admins" value={stats?.totalAdmins ?? 0} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Exams" value={stats?.totalExams ?? 0} />
            <StatCard title="Draft Exams" value={stats?.draftExams ?? 0} />
            <StatCard title="Published Exams" value={stats?.publishedExams ?? 0} />
            <StatCard title="Closed Exams" value={stats?.closedExams ?? 0} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard title="Total Submissions" value={stats?.totalSubmissions ?? 0} />
            <StatCard title="Submitted" value={stats?.submittedSubmissions ?? 0} />
            <StatCard title="Graded" value={stats?.gradedSubmissions ?? 0} />
          </div>

          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Quick Actions
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Jump to the main admin management tools.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/admin/users">
                  <Button>Manage Users</Button>
                </Link>

                <Link to="/admin/exams">
                  <Button variant="secondary">View Exams</Button>
                </Link>

                <Link to="/admin/users">
                  <Button variant="ghost">Create User</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;