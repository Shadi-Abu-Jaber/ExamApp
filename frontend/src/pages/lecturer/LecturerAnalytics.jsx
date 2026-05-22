import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  GraduationCap,
  LineChart,
  RefreshCw,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { fetchLecturerStatistics } from '../../api/statistics';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';

const LecturerAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadStats = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const res = await fetchLecturerStatistics();
      setStats(res.data);
    } catch (err) {
      setStats(null);
      setError(err.response?.data?.message || 'Unable to load analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const kpis = useMemo(() => {
    return [
      {
        title: 'Total Exams',
        value: stats?.totalExams ?? 0,
        subtitle: 'Created by you',
        icon: ClipboardList,
        tone: 'from-blue-600 to-indigo-600',
      },
      {
        title: 'Submissions',
        value: stats?.totalSubmissions ?? 0,
        subtitle: 'All attempts',
        icon: Users,
        tone: 'from-purple-600 to-fuchsia-600',
      },
      {
        title: 'Average Score',
        value: `${stats?.averageScore ?? 0}`,
        subtitle: 'Across graded submissions',
        icon: Target,
        tone: 'from-emerald-600 to-teal-600',
      },
      {
        title: 'Pass Rate',
        value: `${stats?.passRate ?? 0}%`,
        subtitle: 'Score >= 60',
        icon: Trophy,
        tone: 'from-amber-500 to-orange-600',
      },
    ];
  }, [stats]);

  const examStatusData = stats?.examStatusData || [];
  const submissionStatusData = stats?.submissionStatusData || [];
  const examPerformance = stats?.examPerformance || [];

  const getStatusVariant = (status) => {
    if (status === 'PUBLISHED') return 'success';
    if (status === 'CLOSED') return 'danger';
    return 'warning';
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Analytics"
          subtitle="Loading lecturer analytics dashboard..."
        />
        <Card className="flex min-h-[280px] items-center justify-center">
          <LoadingSpinner />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Track exam performance, submissions, grading, and pass rate"
        action={
          <Button
            type="button"
            variant="secondary"
            onClick={() => loadStats(true)}
            disabled={refreshing}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 ring-1 ring-white/15">
              <LineChart className="h-4 w-4" />
              Lecturer Analytics Center
            </div>

            <h1 className="text-4xl font-black tracking-tight">
              Measure exam quality and student performance
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100">
              Review pass rate, average score, submission progress, and exam
              performance from a single analytics workspace.
            </p>
          </div>

          <div className="rounded-3xl bg-white/10 p-5 text-center ring-1 ring-white/15">
            <p className="text-sm text-blue-100">Overall Average</p>
            <p className="mt-2 text-5xl font-black">
              {stats?.averageScore ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="overflow-hidden rounded-3xl border border-white/70 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-2 text-4xl font-black text-slate-950">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {item.subtitle}
                  </p>
                </div>

                <div
                  className={`rounded-2xl bg-gradient-to-br ${item.tone} p-3 text-white shadow-lg`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Exam Lifecycle
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Draft, published, and closed exam distribution.
              </p>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>

          {examStatusData.some((item) => item.value > 0) ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={examStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {examStatusData.map((entry) => (
                      <Cell key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No exam status data"
              description="Create exams to populate this chart."
            />
          )}

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="font-bold text-slate-950">
                {stats?.draftExams ?? 0}
              </div>
              <div className="text-xs text-slate-500">Draft</div>
            </div>

            <div className="rounded-2xl bg-green-50 p-3">
              <div className="font-bold text-green-700">
                {stats?.publishedExams ?? 0}
              </div>
              <div className="text-xs text-green-700">Published</div>
            </div>

            <div className="rounded-2xl bg-red-50 p-3">
              <div className="font-bold text-red-700">
                {stats?.closedExams ?? 0}
              </div>
              <div className="text-xs text-red-700">Closed</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-950">
              Submission Status
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              In progress, submitted, and graded attempt distribution.
            </p>
          </div>

          {submissionStatusData.some((item) => item.value > 0) ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={submissionStatusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No submissions yet"
              description="Student submissions will appear here after exams begin."
            />
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Exam Performance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Compare average score, submissions, questions, and assigned
              students by exam.
            </p>
          </div>

          <Link to="/lecturer/exams">
            <Button variant="secondary">Manage Exams</Button>
          </Link>
        </div>

        {examPerformance.length ? (
          <div className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examPerformance.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="title"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="averageScore" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="submissions" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3">Exam</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Questions</th>
                    <th className="px-3 py-3">Assigned</th>
                    <th className="px-3 py-3">Submissions</th>
                    <th className="px-3 py-3">Average</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {examPerformance.map((exam) => (
                    <tr
                      key={exam.examId}
                      className="border-b border-slate-100"
                    >
                      <td className="px-3 py-4 font-semibold text-slate-900">
                        {exam.title}
                      </td>

                      <td className="px-3 py-4">
                        <Badge variant={getStatusVariant(exam.status)}>
                          {exam.status}
                        </Badge>
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {exam.questions}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {exam.assignedStudents}
                      </td>

                      <td className="px-3 py-4 text-slate-600">
                        {exam.submissions}
                      </td>

                      <td className="px-3 py-4 font-bold text-slate-950">
                        {exam.averageScore}
                      </td>

                      <td className="px-3 py-4">
                        <Link to={`/lecturer/exams/${exam.examId}/monitor`}>
                          <Button size="sm" variant="secondary">
                            Monitor
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No exams found"
            description="Create and publish exams to generate analytics."
          />
        )}
      </Card>
    </>
  );
};

export default LecturerAnalytics;