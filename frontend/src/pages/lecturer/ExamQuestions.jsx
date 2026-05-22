import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  fetchQuestions,
  createQuestion,
  deleteQuestion,
} from '../../api/questions';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import LoadingSpinner from '../../components/LoadingSpinner';

const DEFAULT_MCQ_OPTIONS = [
  { optionText: '', isCorrect: true },
  { optionText: '', isCorrect: false },
];

const ExamQuestions = () => {
  const { id } = useParams();

  const [questions, setQuestions] = useState([]);
  const [mcqOptions, setMcqOptions] = useState(DEFAULT_MCQ_OPTIONS);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState('true');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      questionText: '',
      questionType: 'MCQ',
      points: 5,
      orderIndex: 1,
    },
  });

  const questionType = watch('questionType');

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) => {
      const aOrder = Number(a.orderIndex || 0);
      const bOrder = Number(b.orderIndex || 0);
      return aOrder - bOrder;
    });
  }, [questions]);

  const loadQuestions = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetchQuestions(id);
      setQuestions(res.data || []);
    } catch (err) {
      setQuestions([]);
      setError(err.response?.data?.message || 'Unable to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [id]);

  const resetForm = () => {
    reset({
      questionText: '',
      questionType: 'MCQ',
      points: 5,
      orderIndex: questions.length + 2,
    });

    setMcqOptions(DEFAULT_MCQ_OPTIONS);
    setTrueFalseAnswer('true');
  };

  const updateMcqOptionText = (index, value) => {
    setMcqOptions((prev) =>
      prev.map((option, i) =>
        i === index ? { ...option, optionText: value } : option
      )
    );
  };

  const markCorrectMcqOption = (index) => {
    setMcqOptions((prev) =>
      prev.map((option, i) => ({
        ...option,
        isCorrect: i === index,
      }))
    );
  };

  const addMcqOption = () => {
    setMcqOptions((prev) => [
      ...prev,
      { optionText: '', isCorrect: false },
    ]);
  };

  const removeMcqOption = (index) => {
    if (mcqOptions.length <= 2) {
      setError('MCQ question must have at least 2 options.');
      return;
    }

    const removedWasCorrect = mcqOptions[index]?.isCorrect;

    const nextOptions = mcqOptions.filter((_, i) => i !== index);

    if (removedWasCorrect && nextOptions.length > 0) {
      nextOptions[0].isCorrect = true;
    }

    setMcqOptions(nextOptions);
  };

  const buildOptionsForSubmit = (type) => {
    if (type === 'MCQ') {
      const cleanOptions = mcqOptions
        .map((option) => ({
          optionText: option.optionText.trim(),
          isCorrect: Boolean(option.isCorrect),
        }))
        .filter((option) => option.optionText.length > 0);

      if (cleanOptions.length < 2) {
        throw new Error('MCQ question must have at least 2 options.');
      }

      if (!cleanOptions.some((option) => option.isCorrect)) {
        throw new Error('Please choose the correct MCQ option.');
      }

      return cleanOptions;
    }

    if (type === 'TRUE_FALSE') {
      return [
        {
          optionText: 'True',
          isCorrect: trueFalseAnswer === 'true',
        },
        {
          optionText: 'False',
          isCorrect: trueFalseAnswer === 'false',
        },
      ];
    }

    return [];
  };

  const onSubmit = async (data) => {
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const type = data.questionType;

      const payload = {
        questionText: data.questionText.trim(),
        questionType: type,
        points: Number(data.points),
        orderIndex: Number(data.orderIndex),
        options: buildOptionsForSubmit(type),
      };

      if (!payload.questionText) {
        throw new Error('Question text is required.');
      }

      if (!payload.points || payload.points <= 0) {
        throw new Error('Points must be greater than 0.');
      }

      if (!payload.orderIndex || payload.orderIndex <= 0) {
        throw new Error('Order index must be greater than 0.');
      }

      await createQuestion(id, payload);

      setSuccess('Question added successfully.');
      resetForm();
      await loadQuestions();
    } catch (err) {
      setError(
        err.message ||
          err.response?.data?.message ||
          'Unable to create question.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (questionId) => {
    setError('');
    setSuccess('');

    const confirmed = window.confirm(
      'Are you sure you want to delete this question?'
    );

    if (!confirmed) return;

    setDeletingId(questionId);

    try {
      await deleteQuestion(questionId);
      setSuccess('Question deleted successfully.');
      await loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete question.');
    } finally {
      setDeletingId(null);
    }
  };

  const getOptions = (question) => {
    return question.options || question.questionOptions || [];
  };

  const getTypeLabel = (type) => {
    const labels = {
      MCQ: 'Multiple Choice',
      TRUE_FALSE: 'True / False',
      SHORT_TEXT: 'Short Answer',
      ESSAY: 'Essay',
    };

    return labels[type] || type;
  };

  const getBadgeVariant = (type) => {
    if (type === 'MCQ') return 'info';
    if (type === 'TRUE_FALSE') return 'success';
    if (type === 'ESSAY') return 'warning';
    return 'default';
  };

  return (
    <>
      <PageHeader
        title="Questions"
        subtitle="Build a professional exam with multiple question types"
      />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">
              Add Question
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose the type, points, and correct answer when needed.
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

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Textarea
              label="Question text"
              rows={4}
              placeholder="Write the question here..."
              {...register('questionText', {
                required: 'Question text is required.',
              })}
              error={errors.questionText?.message}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Question type
              </label>
              <select
                {...register('questionType')}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="MCQ">Multiple Choice</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="SHORT_TEXT">Short Answer</option>
                <option value="ESSAY">Essay</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Points"
                type="number"
                min="1"
                {...register('points', {
                  required: 'Points are required.',
                  min: {
                    value: 1,
                    message: 'Points must be greater than 0.',
                  },
                })}
                error={errors.points?.message}
              />

              <Input
                label="Order"
                type="number"
                min="1"
                {...register('orderIndex', {
                  required: 'Order is required.',
                  min: {
                    value: 1,
                    message: 'Order must be greater than 0.',
                  },
                })}
                error={errors.orderIndex?.message}
              />
            </div>

            {questionType === 'MCQ' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Answer options
                    </h3>
                    <p className="text-xs text-slate-500">
                      Select the radio button next to the correct answer.
                    </p>
                  </div>

                  <Button type="button" variant="secondary" onClick={addMcqOption}>
                    Add option
                  </Button>
                </div>

                <div className="space-y-3">
                  {mcqOptions.map((option, index) => (
                    <div
                      key={`option-${index}`}
                      className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
                    >
                      <input
                        type="radio"
                        name="correctOption"
                        checked={option.isCorrect}
                        onChange={() => markCorrectMcqOption(index)}
                        className="h-4 w-4"
                      />

                      <input
                        value={option.optionText}
                        onChange={(e) =>
                          updateMcqOptionText(index, e.target.value)
                        }
                        placeholder={`Option ${index + 1}`}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <button
                        type="button"
                        onClick={() => removeMcqOption(index)}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {questionType === 'TRUE_FALSE' && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  Correct answer
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
                    <input
                      type="radio"
                      name="trueFalseAnswer"
                      checked={trueFalseAnswer === 'true'}
                      onChange={() => setTrueFalseAnswer('true')}
                    />
                    <span className="font-medium text-slate-700">True</span>
                  </label>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
                    <input
                      type="radio"
                      name="trueFalseAnswer"
                      checked={trueFalseAnswer === 'false'}
                      onChange={() => setTrueFalseAnswer('false')}
                    />
                    <span className="font-medium text-slate-700">False</span>
                  </label>
                </div>
              </div>
            )}

            {(questionType === 'SHORT_TEXT' || questionType === 'ESSAY') && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                This question type will be graded manually by the lecturer.
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Reset
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding...' : 'Add Question'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Existing Questions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {questions.length} question{questions.length === 1 ? '' : 's'} in
                this exam
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : sortedQuestions.length ? (
            <div className="space-y-4">
              {sortedQuestions.map((question) => {
                const options = getOptions(question);

                return (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getBadgeVariant(question.questionType)}>
                            {getTypeLabel(question.questionType)}
                          </Badge>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {question.points} points
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            Order {question.orderIndex}
                          </span>
                        </div>

                        <h3 className="text-base font-semibold text-slate-900">
                          {question.questionText}
                        </h3>
                      </div>

                      <Button
                        type="button"
                        variant="danger"
                        disabled={deletingId === question.id}
                        onClick={() => handleDelete(question.id)}
                      >
                        {deletingId === question.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>

                    {options.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Options
                        </p>

                        <div className="grid gap-2">
                          {options.map((option) => (
                            <div
                              key={option.id || option.optionText}
                              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                                option.isCorrect
                                  ? 'border-green-300 bg-green-50 text-green-800'
                                  : 'border-slate-200 bg-slate-50 text-slate-700'
                              }`}
                            >
                              <span>{option.optionText}</span>

                              {option.isCorrect && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                                  Correct
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No questions"
              description="No questions have been added for this exam yet."
            />
          )}
        </Card>
      </div>
    </>
  );
};

export default ExamQuestions;