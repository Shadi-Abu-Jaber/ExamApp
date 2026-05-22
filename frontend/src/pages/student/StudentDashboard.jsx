import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import studentService from '../../services/StudentService';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import Badge from '../../components/Badge';

const StudentDashboard = () => {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [availableExamsData, resultsData] = await Promise.all([
        studentService.listAvailableExams(),
        studentService.listResults(),
      ]);

      setExams(availableExamsData || []);
      setResults(resultsData || []);
    } catch (err) {
      setExams([]);
      setResults([]);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load student dashboard.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const gradedResults = results.filter(
      (result) =>
        result.status === 'GRADED' &&
        result.totalScore !== null &&
        result.totalScore !== undefined
    );

    const averageScore =
      gradedResults.length > 0
        ? gradedResults.reduce(
            (sum, result) => sum + Number(result.totalScore || 0),
            0
          ) / gradedResults.length
        : 0;

    return {
      availableExams: exams.filter((exam) => exam.status === 'PUBLISHED').length,
      publishedResults: results.length,
      gradedResults: gradedResults.length,
      averageScore: Number(averageScore.toFixed(2)),
    };
  }, [exams, results]);

  const upcomingExams = useMemo(() => {
    return exams
      .filter((exam) => exam.status === 'PUBLISHED')
      .slice(0, 3);
  }, [exams]);

  const recentResults = useMemo(() => {
    return results.slice(0, 3);
  }, [results]);

  const formatDate = (value) => {
    if (!value) return 'Not available';

    try {
      return new Date(value).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getResultVariant = (status) => {
    if (status === 'GRADED') return 'success';
    if (status === 'SUBMITTED') return 'warning';
    return 'default';
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Student Dashboard"
          subtitle="Loading your exams and results..."
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
        title="Student Dashboard"
        subtitle="Track your available exams, submissions, and published results"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/student/exams">
              <Button>View Exams</Button>
            </Link>

            <Link to="/student/results">
              <Button variant="secondary">View Results</Button>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="mb-6">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">
            Available Exams
          </p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {stats.availableExams}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">
            Published Results
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.publishedResults}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">
            Graded Exams
          </p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {stats.gradedResults}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">
            Average Score
          </p>
          <p className="mt-2 text-3xl font-bold text-purple-600">
            {stats.averageScore}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Available Exams
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Exams ready for you to begin
              </p>
            </div>

            <Link to="/student/exams">
              <Button variant="ghost">See All</Button>
            </Link>
          </div>

          {upcomingExams.length > 0 ? (
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="success">AVAILABLE</Badge>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {exam.durationMinutes || 0} min
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900">
                    {exam.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {exam.description || 'No description was provided.'}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Ends: {formatDate(exam.endTime)}
                    </p>

                    <Link to={`/student/exams/${exam.id}/start`}>
                      <Button size="sm">Start</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No available exams"
              description="There are no exams ready to start right now."
            />
          )}
        </Card>

        <Card>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Recent Results
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your latest published exam results
              </p>
            </div>

            <Link to="/student/results">
              <Button variant="ghost">See All</Button>
            </Link>
          </div>

          {recentResults.length > 0 ? (
            <div className="space-y-3">
              {recentResults.map((result) => (
                <div
                  key={result.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={getResultVariant(result.status)}>
                      {result.status}
                    </Badge>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      Score: {result.totalScore ?? 'Pending'}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900">
                    {result.exam?.title || 'Untitled exam'}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Submitted: {formatDate(result.submittedAt)}
                  </p>

                  <div className="mt-4 text-right">
                    <Link to={`/student/results/${result.examId}`}>
                      <Button size="sm" variant="secondary">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No published results"
              description="Your results will appear here after they are published."
            />
          )}
        </Card>
      </div>
    </>
  );
};

export default StudentDashboard;