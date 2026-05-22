import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import studentService from '../../services/StudentService';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';

const ResultDetail = () => {
  const { id } = useParams();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadResult = async () => {
    setLoading(true);
    setError('');

    try {
      const resultData = await studentService.getResult(id);
      setSubmission(resultData);
    } catch (err) {
      setSubmission(null);
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load result details.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResult();
  }, [id]);

  const answers = useMemo(() => {
    const rawAnswers = submission?.answers || [];
    const examQuestions = submission?.exam?.questions || [];

    return rawAnswers.map((answer) => {
      if (answer.question) {
        return answer;
      }

      const question = examQuestions.find(
        (item) => item.id === answer.questionId
      );

      return {
        ...answer,
        question: question || null,
      };
    });
  }, [submission]);

  const maxPoints = useMemo(() => {
    return answers.reduce(
      (sum, answer) => sum + Number(answer.question?.points || 0),
      0
    );
  }, [answers]);

  const earnedPoints = useMemo(() => {
    return answers.reduce(
      (sum, answer) => sum + Number(answer.score || 0),
      0
    );
  }, [answers]);

  const percentage = useMemo(() => {
    if (!maxPoints) return 0;

    const finalScore =
      submission?.totalScore !== null &&
      submission?.totalScore !== undefined
        ? Number(submission.totalScore)
        : earnedPoints;

    return Math.round((finalScore / maxPoints) * 100);
  }, [submission, earnedPoints, maxPoints]);

  const getQuestionOptions = (answer) => {
    return answer.question?.options || answer.question?.questionOptions || [];
  };

  const getSelectedAnswer = (answer) => {
    if (answer.selectedOptionId) {
      const selected = getQuestionOptions(answer).find(
        (option) => option.id === answer.selectedOptionId
      );

      return selected?.optionText || 'Selected option not found';
    }

    return answer.answerText || 'No response';
  };

  const getCorrectAnswer = (answer) => {
    const correctOptions = getQuestionOptions(answer).filter(
      (option) => option.isCorrect
    );

    if (!correctOptions.length) {
      return null;
    }

    return correctOptions.map((option) => option.optionText).join(', ');
  };

  const getTypeLabel = (type) => {
    const labels = {
      MCQ: 'Multiple Choice',
      TRUE_FALSE: 'True / False',
      SHORT_TEXT: 'Short Answer',
      ESSAY: 'Essay',
    };

    return labels[type] || type || 'Question';
  };

  const getStatusVariant = (status) => {
    if (status === 'GRADED') return 'success';
    if (status === 'SUBMITTED') return 'warning';
    return 'default';
  };

  const formatDate = (value) => {
    if (!value) return 'Not available';

    try {
      return new Date(value).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Result Details"
          subtitle="Loading your published result..."
        />

        <Card className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner />
        </Card>
      </>
    );
  }

  if (error || !submission) {
    return (
      <>
        <PageHeader
          title="Result Details"
          subtitle="Unable to display result"
          actions={
            <Link to="/student/results">
              <Button variant="secondary">Back to Results</Button>
            </Link>
          }
        />

        <Alert type="error">{error || 'Result not available.'}</Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Result Details"
        subtitle={submission.exam?.title || 'Published exam result'}
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={handlePrint}>
              Print Result
            </Button>

            <Link to="/student/results">
              <Button variant="secondary">Back to Results</Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant={getStatusVariant(submission.status)}>
              {submission.status}
            </Badge>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Published Result
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-slate-900">
            {submission.exam?.title || 'Untitled exam'}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {submission.exam?.description || 'No description was provided.'}
          </p>

          <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Submitted
              </p>
              <p className="mt-1">{formatDate(submission.submittedAt)}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Duration
              </p>
              <p className="mt-1">
                {submission.exam?.durationMinutes || 0} minutes
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-slate-900">
            Score Summary
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl bg-green-50 p-4">
              <p className="text-sm font-medium text-green-700">Final Score</p>
              <p className="mt-1 text-3xl font-bold text-green-700">
                {submission.totalScore ?? earnedPoints}
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-700">
                Possible Points
              </p>
              <p className="mt-1 text-3xl font-bold text-blue-700">
                {maxPoints}
              </p>
            </div>

            <div className="rounded-2xl bg-purple-50 p-4">
              <p className="text-sm font-medium text-purple-700">
                Percentage
              </p>
              <p className="mt-1 text-3xl font-bold text-purple-700">
                {percentage}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">
          General Feedback
        </h2>

        <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          {submission.feedback || 'No general feedback was provided.'}
        </p>
      </Card>

      <Card>
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">
            Question Review
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review your answers, correct answers, score, and lecturer feedback.
          </p>
        </div>

        {answers.length > 0 ? (
          <div className="space-y-5">
            {answers.map((answer, index) => {
              const question = answer.question || {};
              const correctAnswer = getCorrectAnswer(answer);
              const questionPoints = Number(question.points || 0);

              return (
                <div
                  key={answer.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="info">Question {index + 1}</Badge>

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
                        Score
                      </p>

                      <p className="text-2xl font-bold text-blue-700">
                        {answer.score ?? 0} / {questionPoints}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Your Answer
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                        {getSelectedAnswer(answer)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-green-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                        Correct Answer
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-green-900">
                        {correctAnswer || 'Manual grading question'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Lecturer Feedback
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-amber-900">
                      {answer.feedback || 'No feedback for this answer.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No answers"
            description="This result does not contain answer details."
          />
        )}
      </Card>
    </>
  );
};

export default ResultDetail;