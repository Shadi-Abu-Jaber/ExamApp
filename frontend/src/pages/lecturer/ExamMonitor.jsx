import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Clock,
  RefreshCw,
  Users,
  XCircle,
} from 'lucide-react';

import { fetchExamMonitor } from '../../api/exams';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Input from '../../components/Input';

const ExamMonitor = () => {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadMonitor = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const res = await fetchExamMonitor(id);
      setData(res.data);
    } catch (err) {
      setData(null);
      setError(err.response?.data?.message || 'Unable to load exam monitor.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMonitor();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMonitor(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [id]);

  const students = data?.students || [];
  const exam = data?.exam;
  const summary = data?.summary || {
    assigned: 0,
    notStarted: 0,
    inProgress: 0,
    submitted: 0,
    graded: 0,
  };

  const filteredStudents = useMemo(() => {
    return students.filter((item) => {
      const text = `${item.student?.fullName || ''} ${
        item.student?.email || ''
      }`.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  const submittedPercent = useMemo(() => {
    if (!summary.assigned) return 0;

    return Math.round(
      ((summary.submitted + summary.graded) / summary.assigned) * 100
    );
  }, [summary]);

  const getStatusVariant = (status) => {
    if (status === 'GRADED') return 'success';
    if (status === 'SUBMITTED') return 'info';
    if (status === 'IN_PROGRESS') return 'warning';
    return 'default';
  };

  const formatDate = (value) => {
    if (!value) return '—';

    try {
      return new Date(value).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Exam Monitor"
          subtitle="Loading live exam activity..."
        />
        <Card className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Exam Monitor"
        subtitle={exam?.title || 'Track assigned students and submissions'}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => loadMonitor(true)}
              disabled={refreshing}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>

            <Link to="/lecturer/exams">
              <Button variant="ghost">Back to Exams</Button>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {exam && (
        <div className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 ring-1 ring-white/15">
                <Activity className="h-4 w-4" />
                Live Exam Monitoring
              </div>

              <h1 className="text-3xl font-black tracking-tight">
                {exam.title}
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-blue-100">
                {exam.description || 'No description was provided.'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-3 py-1">
                  Status: {exam.status}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  Duration: {exam.durationMinutes} min
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  Questions: {exam.counts?.questions ?? 0}
                </span>
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 p-5 text-center ring-1 ring-white/15">
              <p className="text-sm text-blue-100">Submitted / Graded</p>
              <p className="mt-2 text-5xl font-black">{submittedPercent}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Assigned</p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {summary.assigned}
              </p>
            </div>
            <Users className="h-7 w-7 text-slate-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                Not Started
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {summary.notStarted}
              </p>
            </div>
            <XCircle className="h-7 w-7 text-slate-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">
                In Progress
              </p>
              <p className="mt-2 text-3xl font-black text-amber-600">
                {summary.inProgress}
              </p>
            </div>
            <Clock className="h-7 w-7 text-amber-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Submitted</p>
              <p className="mt-2 text-3xl font-black text-blue-600">
                {summary.submitted}
              </p>
            </div>
            <Activity className="h-7 w-7 text-blue-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Graded</p>
              <p className="mt-2 text-3xl font-black text-green-600">
                {summary.graded}
              </p>
            </div>
            <CheckCircle2 className="h-7 w-7 text-green-400" />
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <Input
            label="Search student"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="ALL">All statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="GRADED">Graded</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-950">
            Student Activity
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Auto refreshes every 10 seconds.
          </p>
        </div>

        {filteredStudents.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-3">Student</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Started</th>
                  <th className="px-3 py-3">Submitted</th>
                  <th className="px-3 py-3">Score</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((item) => (
                  <tr
                    key={item.student.id}
                    className="border-b border-slate-100"
                  >
                    <td className="px-3 py-4 font-semibold text-slate-900">
                      {item.student.fullName}
                    </td>

                    <td className="px-3 py-4 text-slate-500">
                      {item.student.email}
                    </td>

                    <td className="px-3 py-4">
                      <Badge variant={getStatusVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </td>

                    <td className="px-3 py-4 text-slate-500">
                      {formatDate(item.startedAt)}
                    </td>

                    <td className="px-3 py-4 text-slate-500">
                      {formatDate(item.submittedAt)}
                    </td>

                    <td className="px-3 py-4 font-semibold text-slate-900">
                      {item.totalScore !== null ? item.totalScore : '—'}
                    </td>

                    <td className="px-3 py-4">
                      {item.submissionId &&
                      (item.status === 'SUBMITTED' ||
                        item.status === 'GRADED') ? (
                        <Link
                          to={`/lecturer/submissions/${item.submissionId}/grade`}
                        >
                          <Button size="sm">Grade / View</Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">
                          No action
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No students found"
            description="No assigned students match your current filters."
          />
        )}
      </Card>
    </>
  );
};

export default ExamMonitor;