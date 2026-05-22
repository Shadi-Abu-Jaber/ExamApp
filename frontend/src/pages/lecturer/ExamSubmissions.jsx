import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import { fetchSubmissions } from '../../api/grading';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import Badge from '../../components/Badge';
import Input from '../../components/Input';

const ExamSubmissions = () => {
  const { id } = useParams();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadSubmissions = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetchSubmissions(id);
      setSubmissions(res.data || []);
    } catch (err) {
      setSubmissions([]);
      setError(err.response?.data?.message || 'Unable to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [id]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const student = submission.student || {};
      const text = `${student.fullName || ''} ${student.email || ''}`.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' || submission.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: submissions.length,
      inProgress: submissions.filter((s) => s.status === 'IN_PROGRESS').length,
      submitted: submissions.filter((s) => s.status === 'SUBMITTED').length,
      graded: submissions.filter((s) => s.status === 'GRADED').length,
    };
  }, [submissions]);

  const getStatusVariant = (status) => {
    if (status === 'GRADED') return 'success';
    if (status === 'SUBMITTED') return 'warning';
    if (status === 'IN_PROGRESS') return 'info';
    return 'default';
  };

  const formatDate = (value) => {
    if (!value) return 'Not submitted';

    try {
      return new Date(value).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <>
      <PageHeader
        title="Submissions"
        subtitle="Review student attempts, grading status, and exam progress"
        action={
          <Link to="/lecturer/exams">
            <Button variant="secondary">Back to Exams</Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">Total Attempts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">In Progress</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {stats.inProgress}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Submitted</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {stats.submitted}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Graded</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {stats.graded}
          </p>
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
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="GRADED">Graded</option>
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner />
        </Card>
      ) : filteredSubmissions.length ? (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => {
            const student = submission.student || {};

            return (
              <Card key={submission.id}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant={getStatusVariant(submission.status)}>
                        {submission.status}
                      </Badge>

                      {submission.totalScore !== null &&
                        submission.totalScore !== undefined && (
                          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                            Score: {submission.totalScore}
                          </span>
                        )}
                    </div>

                    <h2 className="text-xl font-semibold text-slate-900">
                      {student.fullName || 'Unknown student'}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {student.email || 'No email available'}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Started
                        </p>
                        <p className="mt-1">{formatDate(submission.startedAt)}</p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Submitted
                        </p>
                        <p className="mt-1">
                          {formatDate(submission.submittedAt)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Current Score
                        </p>
                        <p className="mt-1">
                          {submission.totalScore !== null &&
                          submission.totalScore !== undefined
                            ? submission.totalScore
                            : 'Not graded'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 xl:w-44">
                    <Link to={`/lecturer/submissions/${submission.id}/grade`}>
                      <Button className="w-full">
                        {submission.status === 'GRADED' ? 'View / Edit' : 'Grade'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No submissions found"
          description={
            submissions.length
              ? 'No submissions match your current search or filter.'
              : 'No student submissions yet.'
          }
        />
      )}
    </>
  );
};

export default ExamSubmissions;