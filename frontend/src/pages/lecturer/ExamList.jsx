import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  fetchExams,
  deleteExam,
  publishExam,
  closeExam,
  assignStudents,
} from '../../api/exams';

import { fetchStudents } from '../../api/users';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import Badge from '../../components/Badge';
import Input from '../../components/Input';
import Modal from '../../components/Modal';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [assignExam, setAssignExam] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetchExams();
      setExams(res.data || []);
    } catch (err) {
      setExams([]);
      setError(err.response?.data?.message || 'Unable to load exams.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    setError('');

    try {
      const res = await fetchStudents();
      setStudents(res.data || []);
    } catch (err) {
      setStudents([]);
      setError(
        err.response?.data?.message ||
          'Unable to load students. Make sure /api/users/students is enabled for lecturers.'
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const text = `${exam.title || ''} ${exam.description || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || exam.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [exams, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: exams.length,
      draft: exams.filter((exam) => exam.status === 'DRAFT').length,
      published: exams.filter((exam) => exam.status === 'PUBLISHED').length,
      closed: exams.filter((exam) => exam.status === 'CLOSED').length,
    };
  }, [exams]);

  const getStatusBadgeVariant = (status) => {
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

  const getCount = (exam, key) => {
    if (exam._count?.[key] !== undefined) return exam._count[key];
    if (Array.isArray(exam[key])) return exam[key].length;
    return null;
  };

  const getAssignedCount = (exam) => {
    return (
      exam._count?.assignments ??
      exam._count?.examStudents ??
      exam._count?.assignedStudents ??
      0
    );
  };

  const runAction = async ({
    examId,
    actionName,
    confirmMessage,
    action,
    successMessage,
  }) => {
    setError('');
    setSuccess('');

    if (confirmMessage && !window.confirm(confirmMessage)) return;

    setActionId(`${actionName}-${examId}`);

    try {
      await action(examId);
      setSuccess(successMessage);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to ${actionName} exam.`);
    } finally {
      setActionId(null);
    }
  };

  const handlePublish = async (exam) => {
    const questionCount = getCount(exam, 'questions') ?? 0;
    const assignedCount = getAssignedCount(exam);

    if (questionCount === 0) {
      setError('You must add at least one question before publishing.');
      return;
    }

    if (assignedCount === 0) {
      setError('Assign at least one student before publishing the exam.');
      return;
    }

    await runAction({
      examId: exam.id,
      actionName: 'publish',
      confirmMessage:
        'Are you sure you want to publish this exam? Assigned students will be able to access it.',
      action: publishExam,
      successMessage: 'Exam published successfully.',
    });
  };

  const handleClose = async (exam) => {
    await runAction({
      examId: exam.id,
      actionName: 'close',
      confirmMessage:
        'Are you sure you want to close this exam? Students will not be able to submit new answers.',
      action: closeExam,
      successMessage: 'Exam closed successfully.',
    });
  };

  const handleDelete = async (exam) => {
    if (exam.status !== 'DRAFT') {
      setError('Only draft exams can be deleted.');
      return;
    }

    await runAction({
      examId: exam.id,
      actionName: 'delete',
      confirmMessage:
        'Are you sure you want to delete this draft exam? This action cannot be undone.',
      action: deleteExam,
      successMessage: 'Exam deleted successfully.',
    });
  };

  const openAssignModal = async (exam) => {
    setError('');
    setSuccess('');
    setAssignExam(exam);
    setSelectedStudentIds([]);

    await loadStudents();
  };

  const closeAssignModal = () => {
    setAssignExam(null);
    setSelectedStudentIds([]);
  };

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }

      return [...prev, studentId];
    });
  };

  const handleSaveAssignments = async () => {
    if (!assignExam) return;

    if (selectedStudentIds.length === 0) {
      setError('Please select at least one student.');
      return;
    }

    setActionId(`assign-${assignExam.id}`);
    setError('');
    setSuccess('');

    try {
      await assignStudents(assignExam.id, {
        studentIds: selectedStudentIds,
      });

      setSuccess('Students assigned successfully.');
      closeAssignModal();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to assign students.');
    } finally {
      setActionId(null);
    }
  };

  const isActionLoading = (name, examId) => actionId === `${name}-${examId}`;

  return (
    <>
      <PageHeader
        title="My Exams"
        subtitle="Create, assign, publish, close, and manage your online exams"
        action={
          <Link to="/lecturer/exams/create">
            <Button variant="primary">Create Exam</Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Alert type="success">{success}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm font-medium text-slate-500">Total Exams</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {counts.total}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Draft</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {counts.draft}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Published</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {counts.published}
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Closed</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {counts.closed}
          </p>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <Input
            label="Search exams"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description..."
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
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
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
            const questionsCount = getCount(exam, 'questions');
            const submissionsCount = getCount(exam, 'submissions');
            const assignedStudentsCount = getAssignedCount(exam);

            const canDelete = exam.status === 'DRAFT';
            const canPublish = exam.status === 'DRAFT';
            const canClose = exam.status === 'PUBLISHED';

            return (
              <Card key={exam.id}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(exam.status)}>
                        {exam.status || 'DRAFT'}
                      </Badge>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {exam.durationMinutes || 0} min
                      </span>

                      {questionsCount !== null && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          {questionsCount} questions
                        </span>
                      )}

                      {submissionsCount !== null && (
                        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                          {submissionsCount} submissions
                        </span>
                      )}

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {assignedStudentsCount} assigned
                      </span>
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
                          Created
                        </p>
                        <p className="mt-1">{formatDate(exam.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 xl:w-52">
                    <Link to={`/lecturer/exams/${exam.id}/questions`}>
                      <Button className="w-full" variant="primary">
                        Questions
                      </Button>
                    </Link>

                    <Link to={`/lecturer/exams/${exam.id}/submissions`}>
                      <Button className="w-full" variant="secondary">
                        Submissions
                      </Button>
                    </Link>

                    <Link to={`/lecturer/exams/${exam.id}/monitor`}>
                      <Button className="w-full" variant="secondary">
                        Monitor
                      </Button>
                    </Link>

                    <Button
                      className="w-full"
                      variant="secondary"
                      onClick={() => openAssignModal(exam)}
                    >
                      Assign Students
                    </Button>

                    <Link to={`/lecturer/exams/${exam.id}/edit`}>
                      <Button className="w-full" variant="ghost">
                        Edit
                      </Button>
                    </Link>

                    {canPublish && (
                      <Button
                        className="w-full"
                        variant="ghost"
                        disabled={isActionLoading('publish', exam.id)}
                        onClick={() => handlePublish(exam)}
                      >
                        {isActionLoading('publish', exam.id)
                          ? 'Publishing...'
                          : 'Publish'}
                      </Button>
                    )}

                    {canClose && (
                      <Button
                        className="w-full"
                        variant="ghost"
                        disabled={isActionLoading('close', exam.id)}
                        onClick={() => handleClose(exam)}
                      >
                        {isActionLoading('close', exam.id)
                          ? 'Closing...'
                          : 'Close'}
                      </Button>
                    )}

                    <Button
                      className="w-full"
                      variant={canDelete ? 'danger' : 'ghost'}
                      disabled={!canDelete || isActionLoading('delete', exam.id)}
                      onClick={() => handleDelete(exam)}
                    >
                      {isActionLoading('delete', exam.id)
                        ? 'Deleting...'
                        : 'Delete'}
                    </Button>

                    {!canDelete && (
                      <p className="text-center text-xs text-slate-400">
                        Only draft exams can be deleted
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No exams found"
          description={
            exams.length
              ? 'No exams match your current search or filter.'
              : 'You have not created any exams yet.'
          }
          action={
            <Link to="/lecturer/exams/create">
              <Button>Create first exam</Button>
            </Link>
          }
        />
      )}

      <Modal
        open={!!assignExam}
        onClose={closeAssignModal}
        title="Assign Students"
      >
        <div className="space-y-4">
          {assignExam && (
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-900">
                {assignExam.title}
              </p>
              <p className="text-sm text-slate-500">
                Select students who can access this exam.
              </p>
            </div>
          )}

          {loadingStudents ? (
            <div className="flex min-h-[160px] items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : students.length ? (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {students.map((student) => (
                <label
                  key={student.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="h-4 w-4"
                  />

                  <div>
                    <p className="font-medium text-slate-900">
                      {student.fullName}
                    </p>
                    <p className="text-sm text-slate-500">{student.email}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No students found"
              description="Create student users from the Admin panel first."
            />
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" onClick={closeAssignModal}>
              Cancel
            </Button>

            <Button
              type="button"
              disabled={
                !students.length ||
                selectedStudentIds.length === 0 ||
                isActionLoading('assign', assignExam?.id)
              }
              onClick={handleSaveAssignments}
            >
              {isActionLoading('assign', assignExam?.id)
                ? 'Saving...'
                : `Assign ${selectedStudentIds.length} Student${
                    selectedStudentIds.length === 1 ? '' : 's'
                  }`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ExamList;