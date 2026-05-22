import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import { createExam, fetchExams, updateExam } from '../../api/exams';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';

const ExamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingExam, setLoadingExam] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      durationMinutes: 30,
      title: '',
      description: '',
      startTime: '',
      endTime: '',
    },
  });

  const startTime = watch('startTime');
  const endTime = watch('endTime');

  const toDateTimeLocal = (value) => {
    if (!value) return '';

    try {
      const date = new Date(value);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      return localDate.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (!id) return;

    const loadExam = async () => {
      setLoadingExam(true);
      setError('');

      try {
        const res = await fetchExams();
        const exam = res.data.find((item) => item.id === id);

        if (!exam) {
          setError('Exam not found.');
          return;
        }

        reset({
          title: exam.title || '',
          description: exam.description || '',
          durationMinutes: exam.durationMinutes || 30,
          startTime: toDateTimeLocal(exam.startTime),
          endTime: toDateTimeLocal(exam.endTime),
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load exam.');
      } finally {
        setLoadingExam(false);
      }
    };

    loadExam();
  }, [id, reset]);

  const validateTimes = () => {
    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      return 'Start time must be before end time.';
    }

    return true;
  };

  const onSubmit = async (data) => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (data.startTime && data.endTime) {
        const timeValidation = validateTimes();

        if (timeValidation !== true) {
          setError(timeValidation);
          return;
        }
      }

      const payload = {
        title: data.title.trim(),
        description: data.description?.trim() || '',
        durationMinutes: Number(data.durationMinutes),
        startTime: data.startTime || null,
        endTime: data.endTime || null,
      };

      if (!payload.title) {
        setError('Exam title is required.');
        return;
      }

      if (!payload.durationMinutes || payload.durationMinutes <= 0) {
        setError('Duration must be greater than 0.');
        return;
      }

      if (id) {
        await updateExam(id, payload);
        setSuccess('Exam updated successfully.');
      } else {
        await createExam(payload);
        setSuccess('Exam created successfully.');
      }

      setTimeout(() => {
        navigate('/lecturer/exams');
      }, 600);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save exam.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingExam) {
    return (
      <>
        <PageHeader
          title={id ? 'Edit Exam' : 'Create Exam'}
          subtitle="Define exam details and schedule"
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
        title={id ? 'Edit Exam' : 'Create Exam'}
        subtitle={
          id
            ? 'Update exam details, duration, and schedule'
            : 'Define exam details, duration, and schedule'
        }
        action={
          <Link
            to="/lecturer/exams"
            className="inline-flex items-center justify-center rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            Back to Exams
          </Link>
        }
      />

      <Card className="max-w-3xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Basic Details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add a clear title and description so students understand the exam.
          </p>
        </div>

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

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Exam title"
              placeholder="Example: Midterm Exam - Algorithms"
              {...register('title', {
                required: 'Exam title is required.',
                minLength: {
                  value: 2,
                  message: 'Title must contain at least 2 characters.',
                },
              })}
              error={errors.title?.message}
            />

            <Textarea
              label="Description"
              placeholder="Write a short description for students..."
              rows={4}
              {...register('description')}
              error={errors.description?.message}
            />
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-xl font-semibold text-slate-900">Schedule</h2>
            <p className="mt-1 text-sm text-slate-500">
              Set the exam duration and optional start/end window.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Input
                label="Duration minutes"
                type="number"
                min="1"
                placeholder="30"
                {...register('durationMinutes', {
                  required: 'Duration is required.',
                  min: {
                    value: 1,
                    message: 'Duration must be greater than 0.',
                  },
                  valueAsNumber: true,
                })}
                error={errors.durationMinutes?.message}
              />

              <Input
                label="Start time"
                type="datetime-local"
                {...register('startTime', {
                  validate: validateTimes,
                })}
                error={errors.startTime?.message}
              />

              <Input
                label="End time"
                type="datetime-local"
                {...register('endTime', {
                  validate: validateTimes,
                })}
                error={errors.endTime?.message}
              />
            </div>
          </div>

          {startTime && endTime && new Date(startTime) >= new Date(endTime) && (
            <Alert type="error">Start time must be before end time.</Alert>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              to="/lecturer/exams"
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
            >
              Cancel
            </Link>

            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Saving...' : id ? 'Save Changes' : 'Create Exam'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
};

export default ExamForm;