import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { fetchAssignedExams } from '../../api/student';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import Badge from '../../components/Badge';
import Input from '../../components/Input';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadExams = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetchAssignedExams();
      setExams(res.data || []);
    } catch (err) {
      setExams([]);
      setError(err.response?.data?.message || 'Unable to load assigned exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const text = `${exam.title || ''} ${exam.description || ''} ${exam.lecturer?.fullName || ''}`.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'ALL' || exam.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [exams, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: exams.length,
      available: exams.filter((exam) => exam.status === 'PUBLISHED').length,
      draft: exams.filter((exam) => exam.status === 'DRAFT').length,
      closed: exams.filter((exam) => exam.status === 'CLOSED').length,
    };
  }, [exams]);

  const getStatusVariant = (status) => {
    if (status === 'PUBLISHED') return 'success';
    if (status === 'CLOSED') return 'danger';
    return 'warning';
  };

  const formatDate = (value) => {
    if (!value) return 'Not set';

    try {
      return new Date(value).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const isExamAvailable = (exam) => {
    return exam.status === 'PUBLISHED';
  };

  return (
    <>
      <PageHeader
        title="Available Exams"
        subtitle="View exams assigned to you and start available exams"
      />

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">Assigned Exams</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.total}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Available Now</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {stats.available}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Not Published</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {stats.draft}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Closed</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {stats.closed}
          </p>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <Input
            label="Search exams"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, description, or lecturer..."
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
              <option value="PUBLISHED">Available</option>
              <option value="DRAFT">Not Published</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner />
        </Card>
      ) : filteredExams.length ? (
        <div className="space-y-4">
          {filteredExams.map((exam) => {
            const available = isExamAvailable(exam);

            return (
              <Card key={exam.id}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant={getStatusVariant(exam.status)}>
                        {exam.status === 'PUBLISHED'
                          ? 'AVAILABLE'
                          : exam.status}
                      </Badge>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {exam.durationMinutes || 0} min
                      </span>

                      {exam.lecturer?.fullName && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          Lecturer: {exam.lecturer.fullName}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-semibold text-slate-900">
                      {exam.title}
                    </h2>

                    <p className="mt-1 max-w-3xl text-sm text-slate-500">
                      {exam.description || 'No description was provided.'}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Start Time
                        </p>
                        <p className="mt-1">{formatDate(exam.startTime)}</p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          End Time
                        </p>
                        <p className="mt-1">{formatDate(exam.endTime)}</p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Status
                        </p>
                        <p className="mt-1">
                          {available
                            ? 'Ready to start'
                            : exam.status === 'CLOSED'
                              ? 'Exam is closed'
                              : 'Waiting for lecturer to publish'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 xl:w-44">
                    {available ? (
                      <Link to={`/student/exams/${exam.id}/start`}>
                        <Button className="w-full">Start Exam</Button>
                      </Link>
                    ) : (
                      <Button className="w-full" variant="ghost" disabled>
                        Not Available
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No assigned exams"
          description={
            exams.length
              ? 'No exams match your current search or filter.'
              : 'There are no exams assigned to you right now.'
          }
        />
      )}
    </>
  );
};

export default ExamList;