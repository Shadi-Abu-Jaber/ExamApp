import { useEffect, useMemo, useState } from 'react';

import { fetchExams, deleteExam } from '../../api/exams';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';

const statusOptions = ['ALL', 'DRAFT', 'PUBLISHED', 'CLOSED'];

const AdminExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedExam, setSelectedExam] = useState(null);
  const [deleteExamId, setDeleteExamId] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadExams = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetchExams();
      setExams(res.data || []);
    } catch (err) {
      setExams([]);
      setErrorMessage(err.response?.data?.message || 'Unable to load exams.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const searchTerm = search.trim().toLowerCase();

      const matchesSearch =
        !searchTerm ||
        [
          exam.title,
          exam.description,
          exam.lecturer?.fullName,
          exam.lecturer?.email,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchTerm));

      const matchesStatus =
        statusFilter === 'ALL' || exam.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [exams, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: exams.length,
      draft: exams.filter((exam) => exam.status === 'DRAFT').length,
      published: exams.filter((exam) => exam.status === 'PUBLISHED').length,
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
      return new Date(value).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (value) => {
    if (!value) return 'Not set';

    try {
      return new Date(value).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getQuestionsCount = (exam) => exam._count?.questions ?? 0;

  const getAssignedCount = (exam) =>
    exam._count?.examStudents ??
    exam._count?.assignedStudents ??
    exam._count?.assignments ??
    0;

  const getSubmissionsCount = (exam) => exam._count?.submissions ?? 0;

  const openDetails = (exam) => {
    setSelectedExam(exam);
  };

  const closeDetails = () => {
    setSelectedExam(null);
  };

  const confirmDelete = (exam) => {
    if (exam.status !== 'DRAFT') {
      setErrorMessage('Only draft exams can be deleted.');
      return;
    }

    setDeleteExamId(exam.id);
  };

  const closeDelete = () => {
    setDeleteExamId(null);
  };

  const handleDelete = async () => {
    if (!deleteExamId) return;

    setIsDeleting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await deleteExam(deleteExamId);
      await loadExams();

      setSuccessMessage('Exam deleted successfully.');
      closeDelete();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Unable to delete exam.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="All Exams"
        subtitle="View, filter, inspect, and safely manage exams across the system"
      />

      {successMessage && (
        <div className="mb-4">
          <Alert type="success">{successMessage}</Alert>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4">
          <Alert type="error">{errorMessage}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">Total Exams</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.total}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Draft</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {stats.draft}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Published</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {stats.published}
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
        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, or lecturer..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All statuses' : status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner />
        </Card>
      ) : filteredExams.length === 0 ? (
        <EmptyState
          title="No exams found"
          description="Try changing the search text or status filter."
        />
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam) => {
            const canDelete = exam.status === 'DRAFT';

            return (
              <Card key={exam.id}>
                <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-900">
                        {exam.title}
                      </h2>

                      <Badge variant={getStatusVariant(exam.status)}>
                        {exam.status || 'DRAFT'}
                      </Badge>
                    </div>

                    <p className="max-w-3xl text-sm text-slate-600">
                      {exam.description || 'No description provided.'}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Lecturer
                        </p>
                        <p className="mt-1">
                          {exam.lecturer?.fullName || 'Unknown'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Email
                        </p>
                        <p className="mt-1 break-all">
                          {exam.lecturer?.email || 'Unknown'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Duration
                        </p>
                        <p className="mt-1">
                          {exam.durationMinutes || 0} minutes
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Created
                        </p>
                        <p className="mt-1">{formatDate(exam.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 xl:w-56">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => openDetails(exam)}
                    >
                      View Details
                    </Button>

                    <Button
                      type="button"
                      variant={canDelete ? 'danger' : 'ghost'}
                      className="w-full"
                      disabled={!canDelete}
                      onClick={() => confirmDelete(exam)}
                    >
                      Delete
                    </Button>

                    {!canDelete && (
                      <p className="text-center text-xs text-slate-400">
                        Only draft exams can be deleted
                      </p>
                    )}

                    <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                      <div>Questions: {getQuestionsCount(exam)}</div>
                      <div>Assigned: {getAssignedCount(exam)}</div>
                      <div>Submissions: {getSubmissionsCount(exam)}</div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!selectedExam} onClose={closeDetails} title="Exam Details">
        {selectedExam && (
          <div className="space-y-4 text-sm text-slate-700">
            <div>
              <span className="font-semibold">Title:</span>{' '}
              {selectedExam.title}
            </div>

            <div>
              <span className="font-semibold">Description:</span>{' '}
              {selectedExam.description || 'No description'}
            </div>

            <div>
              <span className="font-semibold">Status:</span>{' '}
              <Badge variant={getStatusVariant(selectedExam.status)}>
                {selectedExam.status}
              </Badge>
            </div>

            <div>
              <span className="font-semibold">Lecturer:</span>{' '}
              {selectedExam.lecturer?.fullName || 'Unknown'} (
              {selectedExam.lecturer?.email || 'Unknown'})
            </div>

            <div>
              <span className="font-semibold">Duration:</span>{' '}
              {selectedExam.durationMinutes || 0} minutes
            </div>

            <div>
              <span className="font-semibold">Start time:</span>{' '}
              {formatDateTime(selectedExam.startTime)}
            </div>

            <div>
              <span className="font-semibold">End time:</span>{' '}
              {formatDateTime(selectedExam.endTime)}
            </div>

            <div>
              <span className="font-semibold">Questions:</span>{' '}
              {getQuestionsCount(selectedExam)}
            </div>

            <div>
              <span className="font-semibold">Assigned students:</span>{' '}
              {getAssignedCount(selectedExam)}
            </div>

            <div>
              <span className="font-semibold">Submissions:</span>{' '}
              {getSubmissionsCount(selectedExam)}
            </div>

            <div>
              <span className="font-semibold">Created:</span>{' '}
              {formatDateTime(selectedExam.createdAt)}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteExamId} onClose={closeDelete} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-slate-700">
            Are you sure you want to delete this draft exam? This action cannot
            be undone.
          </p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeDelete}>
              Cancel
            </Button>

            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AdminExamsPage;