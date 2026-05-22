import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  GraduationCap,
  Layers3,
  PenLine,
  PlayCircle,
  Trophy,
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

import { fetchExams } from '../../api/exams';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const LecturerDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetchExams();
      setExams(res.data || []);
    } catch (err) {
      setExams([]);
      setError(err.response?.data?.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const totalExams = exams.length;
    const draftExams = exams.filter((exam) => exam.status === 'DRAFT').length;
    const publishedExams = exams.filter((exam) => exam.status === 'PUBLISHED').length;
    const closedExams = exams.filter((exam) => exam.status === 'CLOSED').length;

    const totalSubmissions = exams.reduce(
      (sum, exam) => sum + (exam._count?.submissions ?? 0),
      0
    );

    const totalQuestions = exams.reduce(
      (sum, exam) => sum + (exam._count?.questions ?? 0),
      0
    );

    const assignedStudents = exams.reduce(
      (sum, exam) =>
        sum +
        (exam._count?.assignments ??
          exam._count?.examStudents ??
          exam._count?.assignedStudents ??
          0),
      0
    );

    return {
      totalExams,
      draftExams,
      publishedExams,
      closedExams,
      totalSubmissions,
      totalQuestions,
      assignedStudents,
    };
  }, [exams]);

  const statusChartData = useMemo(
    () => [
      { name: 'Draft', value: stats.draftExams },
      { name: 'Published', value: stats.publishedExams },
      { name: 'Closed', value: stats.closedExams },
    ],
    [stats]
  );

  const examVolumeData = useMemo(() => {
    return exams.slice(0, 6).map((exam) => ({
      name:
        exam.title?.length > 12
          ? `${exam.title.slice(0, 12)}...`
          : exam.title || 'Exam',
      questions: exam._count?.questions ?? 0,
      submissions: exam._count?.submissions ?? 0,
    }));
  }, [exams]);

  const recentExams = useMemo(() => {
    return [...exams]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [exams]);

  const getStatusVariant = (status) => {
    if (status === 'PUBLISHED') return 'success';
    if (status === 'CLOSED') return 'danger';
    return 'warning';
  };

  const formatDate = (value) => {
    if (!value) return 'Not set';

    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const kpiCards = [
    {
      title: 'Total Exams',
      value: stats.totalExams,
      subtitle: 'All exams created',
      icon: ClipboardList,
      tone: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Published',
      value: stats.publishedExams,
      subtitle: 'Visible to students',
      icon: PlayCircle,
      tone: 'from-emerald-600 to-teal-600',
    },
    {
      title: 'Questions',
      value: stats.totalQuestions,
      subtitle: 'Across all exams',
      icon: BookOpen,
      tone: 'from-violet-600 to-purple-600',
    },
    {
      title: 'Submissions',
      value: stats.totalSubmissions,
      subtitle: 'Student attempts',
      icon: Trophy,
      tone: 'from-amber-500 to-orange-600',
    },
  ];

  const quickActions = [
    {
      title: 'Create Exam',
      description: 'Start a new exam, configure schedule, and duration.',
      to: '/lecturer/exams/create',
      icon: FilePlus2,
    },
    {
      title: 'Manage Exams',
      description: 'Assign students, publish exams, and track status.',
      to: '/lecturer/exams',
      icon: Layers3,
    },
    {
      title: 'Build Questions',
      description: 'Create MCQ, True/False, essay, and short-text questions.',
      to: '/lecturer/exams',
      icon: PenLine,
    },
    {
      title: 'Review Submissions',
      description: 'Grade answers, add feedback, and publish results.',
      to: '/lecturer/exams',
      icon: CheckCircle2,
    },
  ];

  if (loading) {
    return (
      <>
        <PageHeader
          title="Lecturer Dashboard"
          subtitle="Loading your academic workspace..."
        />
        <Card className="flex min-h-[320px] items-center justify-center">
          <LoadingSpinner />
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 ring-1 ring-white/15">
              <GraduationCap className="h-4 w-4" />
              Lecturer Workspace
            </div>

            <h1 className="text-4xl font-black tracking-tight">
              Build, monitor, and grade exams intelligently
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
              Manage exam lifecycle, assign students, review submissions, and
              analyze performance from one production-ready dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/lecturer/exams/create">
              <Button className="bg-white text-slate-950 hover:bg-blue-50">
                Create New Exam
              </Button>
            </Link>

            <Link to="/lecturer/exams">
              <Button variant="secondary">Manage Exams</Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="overflow-hidden rounded-3xl border border-white/70 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    {card.title}
                  </p>
                  <p className="mt-2 text-4xl font-black text-slate-950">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {card.subtitle}
                  </p>
                </div>

                <div
                  className={`rounded-2xl bg-gradient-to-br ${card.tone} p-3 text-white shadow-lg`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Exam Workload
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Questions and submissions by recent exams.
              </p>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>

          {examVolumeData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="questions" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="submissions" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No chart data"
              description="Create exams with questions and submissions to populate this chart."
            />
          )}
        </Card>

        <Card>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-950">Exam Status</h2>
            <p className="mt-1 text-sm text-slate-500">
              Distribution of exams by lifecycle state.
            </p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {statusChartData.map((entry) => (
                    <Cell key={entry.name} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="font-bold text-slate-950">{stats.draftExams}</div>
              <div className="text-xs text-slate-500">Draft</div>
            </div>

            <div className="rounded-2xl bg-green-50 p-3">
              <div className="font-bold text-green-700">
                {stats.publishedExams}
              </div>
              <div className="text-xs text-green-700">Published</div>
            </div>

            <div className="rounded-2xl bg-red-50 p-3">
              <div className="font-bold text-red-700">{stats.closedExams}</div>
              <div className="text-xs text-red-700">Closed</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-950">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Continue your most important exam workflows.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  to={action.to}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="font-bold text-slate-950">{action.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-950">Recent Exams</h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest exams you created or updated.
            </p>
          </div>

          {recentExams.length ? (
            <div className="space-y-3">
              {recentExams.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusVariant(exam.status)}>
                      {exam.status || 'DRAFT'}
                    </Badge>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {exam.durationMinutes || 0} min
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {exam._count?.questions ?? 0} questions
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-950">{exam.title}</h3>

                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {exam.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to={`/lecturer/exams/${exam.id}/questions`}>
                      <Button size="sm" variant="secondary">
                        Questions
                      </Button>
                    </Link>

                    <Link to={`/lecturer/exams/${exam.id}/submissions`}>
                      <Button size="sm" variant="ghost">
                        Submissions
                      </Button>
                    </Link>
                  </div>

                  <p className="mt-3 text-xs font-medium text-slate-400">
                    Created: {formatDate(exam.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No exams yet"
              description="Create your first exam to start building questions and assigning students."
              action={
                <Link to="/lecturer/exams/create">
                  <Button>Create Exam</Button>
                </Link>
              }
            />
          )}
        </Card>
      </div>
    </>
  );
};

export default LecturerDashboard;