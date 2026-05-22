import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import {
  fetchSubmission,
  gradeAnswer,
  gradeSubmission,
  publishGrade,
} from '../../api/grading';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import Button from '../../components/Button';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';

const GradeSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [scores, setScores] = useState({});
  const [answerFeedback, setAnswerFeedback] = useState({});

  const [totalScore, setTotalScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingAnswerId, setSavingAnswerId] = useState(null);
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage('');
    }, 3500);
  };

  const loadSubmission = async () => {
    setLoading(true);

    try {
      const res = await fetchSubmission(id);
      const data = res.data;

      setSubmission(data);
      setTotalScore(
        data.totalScore !== null && data.totalScore !== undefined
          ? String(data.totalScore)
          : ''
      );
      setFeedback(data.feedback || '');

      const initialScores = {};
      const initialFeedback = {};

      (data.answers || []).forEach((answer) => {
        initialScores[answer.id] =
          answer.score !== null && answer.score !== undefined
            ? Number(answer.score)
            : 0;

        initialFeedback[answer.id] = answer.feedback || '';
      });

      setScores(initialScores);
      setAnswerFeedback(initialFeedback);
    } catch (err) {
      showMessage(
        err.response?.data?.message || 'Unable to load submission.',
        'error'
      );
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmission();
  }, [id]);

  const maxPoints = useMemo(() => {
    return (submission?.answers || []).reduce(
      (sum, answer) => sum + Number(answer.question?.points || 0),
      0
    );
  }, [submission]);

  const calculatedScore = useMemo(() => {
    return Object.values(scores).reduce(
      (sum, score) => sum + Number(score || 0),
      0
    );
  }, [scores]);

  const getStatusVariant = (status) => {
    if (status === 'GRADED') return 'success';
    if (status === 'SUBMITTED') return 'warning';
    if (status === 'IN_PROGRESS') return 'info';
    return 'default';
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

  const getQuestionOptions = (answer) => {
    return answer.question?.options || answer.question?.questionOptions || [];
  };

  const getSelectedOptionText = (answer) => {
    const options = getQuestionOptions(answer);
    const selected = options.find((option) => option.id === answer.selectedOptionId);

    return selected?.optionText || 'Selected option not found';
  };

  const getCorrectAnswerText = (answer) => {
    const options = getQuestionOptions(answer);
    const correct = options.filter((option) => option.isCorrect);

    if (!correct.length) return null;

    return correct.map((option) => option.optionText).join(', ');
  };

  const updateScore = (answer, value) => {
    const max = Number(answer.question?.points || 0);
    let nextScore = Number(value);

    if (Number.isNaN(nextScore)) nextScore = 0;
    if (nextScore < 0) nextScore = 0;
    if (nextScore > max) nextScore = max;

    setScores((prev) => ({
      ...prev,
      [answer.id]: nextScore,
    }));
  };

  const handleGradeAnswer = async (answer) => {
    const score = Number(scores[answer.id] || 0);
    const max = Number(answer.question?.points || 0);

    if (score < 0 || score > max) {
      showMessage(`Score must be between 0 and ${max}.`, 'error');
      return;
    }

    setSavingAnswerId(answer.id);

    try {
      await gradeAnswer(answer.id, {
        score,
        feedback: answerFeedback[answer.id] || '',
      });

      showMessage('Answer grade saved successfully.');
      await loadSubmission();
    } catch (err) {
      showMessage(
        err.response?.data?.message || 'Unable to save answer grade.',
        'error'
      );
    } finally {
      setSavingAnswerId(null);
    }
  };

  const handleSaveAllAnswers = async () => {
    setSavingSubmission(true);

    try {
      for (const answer of submission.answers || []) {
        const score = Number(scores[answer.id] || 0);
        const max = Number(answer.question?.points || 0);

        if (score < 0 || score > max) {
          throw new Error(
            `Invalid score for question "${answer.question?.questionText}".`
          );
        }

        await gradeAnswer(answer.id, {
          score,
          feedback: answerFeedback[answer.id] || '',
        });
      }

      await gradeSubmission(id, {
        totalScore: Number(calculatedScore || 0),
        feedback,
      });

      setTotalScore(String(calculatedScore || 0));
      showMessage('All grades saved successfully.');
      await loadSubmission();
    } catch (err) {
      showMessage(
        err.message || err.response?.data?.message || 'Unable to save grades.',
        'error'
      );
    } finally {
      setSavingSubmission(false);
    }
  };

  const handleSaveTotal = async () => {
    const numericTotal = Number(totalScore || 0);

    if (numericTotal < 0 || numericTotal > maxPoints) {
      showMessage(`Total score must be between 0 and ${maxPoints}.`, 'error');
      return;
    }

    setSavingSubmission(true);

    try {
      await gradeSubmission(id, {
        totalScore: numericTotal,
        feedback,
      });

      showMessage('Overall grade saved successfully.');
      await loadSubmission();
    } catch (err) {
      showMessage(
        err.response?.data?.message || 'Unable to save overall grade.',
        'error'
      );
    } finally {
      setSavingSubmission(false);
    }
  };

  const handleUseCalculatedScore = () => {
    setTotalScore(String(calculatedScore));
  };

  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to publish this result?')) {
      return;
    }

    setPublishing(true);

    try {
      await publishGrade(id);
      showMessage('Result published successfully.');
      setTimeout(() => navigate('/lecturer/exams'), 1500);
    } catch (err) {
      showMessage(
        err.response?.data?.message || 'Unable to publish result.',
        'error'
      );
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Grade Submission"
          subtitle="Loading student submission..."
        />
        <Card className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner />
        </Card>
      </>
    );
  }

  if (!submission) {
    return (
      <>
        <PageHeader title="Grade Submission" subtitle="Submission not found" />
        <Alert type="error">Submission not found.</Alert>
      </>
    );
  }

  const answers = submission.answers || [];

  return (
    <>
      <PageHeader
        title="Grade Submission"
        subtitle="Review answers, assign scores, and publish student feedback"
        action={
          <Link to="/lecturer/exams">
            <Button variant="secondary">Back to Exams</Button>
          </Link>
        }
      />

      {message && (
        <div className="mb-4">
          <Alert type={messageType}>{message}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant={getStatusVariant(submission.status)}>
                  {submission.status}
                </Badge>

                {submission.exam?.title && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {submission.exam.title}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-semibold text-slate-900">
                {submission.student?.fullName || 'Unknown student'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {submission.student?.email || 'No email available'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">Started:</span>{' '}
                {submission.startedAt
                  ? new Date(submission.startedAt).toLocaleString()
                  : 'Not available'}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-900">Submitted:</span>{' '}
                {submission.submittedAt
                  ? new Date(submission.submittedAt).toLocaleString()
                  : 'Not submitted'}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-slate-900">
            Score Summary
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Possible Points
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {maxPoints}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-700">
                Calculated Score
              </p>
              <p className="mt-1 text-3xl font-bold text-blue-700">
                {calculatedScore}
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-sm font-medium text-green-700">
                Saved Total
              </p>
              <p className="mt-1 text-3xl font-bold text-green-700">
                {submission.totalScore ?? '—'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Student Answers
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Grade each answer and provide optional feedback.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              disabled={savingSubmission}
              onClick={handleSaveAllAnswers}
            >
              {savingSubmission ? 'Saving all...' : 'Save All Grades'}
            </Button>
          </div>

          {answers.length ? (
            <div className="space-y-5">
              {answers.map((answer, index) => {
                const question = answer.question || {};
                const options = getQuestionOptions(answer);
                const correctAnswer = getCorrectAnswerText(answer);
                const questionPoints = Number(question.points || 0);

                return (
                  <div
                    key={answer.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge variant="info">
                            Question {index + 1}
                          </Badge>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {getTypeLabel(question.questionType)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {questionPoints} points
                          </span>
                        </div>

                        <h3 className="text-base font-semibold text-slate-900">
                          {question.questionText || 'Question text unavailable'}
                        </h3>
                      </div>

                      <div className="rounded-2xl bg-blue-50 px-4 py-3 text-center">
                        <p className="text-xs font-medium text-blue-700">
                          Current Score
                        </p>
                        <p className="text-2xl font-bold text-blue-700">
                          {scores[answer.id] ?? answer.score ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Student Answer
                        </p>

                        <div className="mt-2 text-sm text-slate-800">
                          {answer.selectedOptionId ? (
                            <p className="font-medium">
                              {getSelectedOptionText(answer)}
                            </p>
                          ) : answer.answerText ? (
                            <p className="whitespace-pre-wrap">
                              {answer.answerText}
                            </p>
                          ) : (
                            <p className="italic text-slate-400">
                              No answer provided
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-green-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                          Correct Answer
                        </p>

                        <div className="mt-2 text-sm text-green-900">
                          {correctAnswer ? (
                            <p className="font-medium">{correctAnswer}</p>
                          ) : options.length ? (
                            <div className="space-y-1">
                              {options.map((option) => (
                                <div
                                  key={option.id || option.optionText}
                                  className={
                                    option.isCorrect
                                      ? 'font-semibold text-green-800'
                                      : 'text-green-700'
                                  }
                                >
                                  {option.optionText}
                                  {option.isCorrect ? ' ✓' : ''}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="italic text-green-700">
                              Manual grading question
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[180px_1fr_auto] lg:items-end">
                      <Input
                        label={`Score 0-${questionPoints}`}
                        type="number"
                        min="0"
                        max={questionPoints}
                        value={scores[answer.id] ?? answer.score ?? 0}
                        onChange={(e) => updateScore(answer, e.target.value)}
                      />

                      <Textarea
                        label="Answer feedback"
                        rows={3}
                        value={answerFeedback[answer.id] || ''}
                        onChange={(e) =>
                          setAnswerFeedback((prev) => ({
                            ...prev,
                            [answer.id]: e.target.value,
                          }))
                        }
                        placeholder="Optional feedback for this answer..."
                      />

                      <Button
                        type="button"
                        disabled={savingAnswerId === answer.id}
                        onClick={() => handleGradeAnswer(answer)}
                      >
                        {savingAnswerId === answer.id
                          ? 'Saving...'
                          : 'Save Answer'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No answers"
              description="This submission does not contain any answers."
            />
          )}
        </Card>

        <Card>
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">
              Overall Grade
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Save the final score and general feedback for the student.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <Input
              label={`Total Score 0-${maxPoints}`}
              type="number"
              min="0"
              max={maxPoints}
              value={totalScore}
              onChange={(e) => setTotalScore(e.target.value)}
            />

            <Textarea
              label="General feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Provide final feedback to the student..."
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleUseCalculatedScore}
            >
              Use Calculated Score
            </Button>

            <Button
              type="button"
              disabled={savingSubmission}
              onClick={handleSaveTotal}
            >
              {savingSubmission ? 'Saving...' : 'Save Overall Grade'}
            </Button>

            <Button
              type="button"
              variant="primary"
              disabled={publishing}
              onClick={handlePublish}
            >
              {publishing ? 'Publishing...' : 'Publish Result'}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default GradeSubmission;