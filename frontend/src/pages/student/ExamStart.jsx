import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  fetchAssignedExams,
  startExam,
  getSubmission,
  saveAnswer,
  submitExam,
  fetchExamQuestions,
} from '../../api/student';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import Badge from '../../components/Badge';

const ExamStart = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [examDetails, setExamDetails] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timer, setTimer] = useState(0);

  const [answerData, setAnswerData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [savedAt, setSavedAt] = useState(null);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const autoSubmittedRef = useRef(false);

  const current = questions[currentQuestion];

  const loadExam = async () => {
    setError('');

    try {
      const response = await startExam(id);
      const result = await getSubmission(response.data.id);
      const questionsResponse = await fetchExamQuestions(id);
      const assignedExamsResponse = await fetchAssignedExams();

      const sortedQuestions = (questionsResponse.data || []).sort(
        (a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0)
      );

      const exam = assignedExamsResponse.data.find((item) => item.id === id);

      setSubmission(result.data);
      setQuestions(sortedQuestions);
      setExamDetails(exam || result.data.exam || null);

      if (exam?.endTime) {
        const remaining = Math.max(
          0,
          new Date(exam.endTime).getTime() - Date.now()
        );
        setTimer(Math.ceil(remaining / 1000));
      } else if (exam?.durationMinutes) {
        setTimer(Number(exam.durationMinutes) * 60);
      }

      if (result.data.answers && result.data.answers.length > 0) {
        const restored = {};

        result.data.answers.forEach((answer) => {
          restored[answer.questionId] =
            answer.selectedOptionId || answer.answerText || '';
        });

        setAnswerData(restored);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start exam.');

      setTimeout(() => {
        navigate('/student/exams');
      }, 2000);
    }
  };

  useEffect(() => {
    loadExam();
  }, [id]);

  const autoSubmit = async () => {
    if (!submission || submitted || autoSubmittedRef.current) return;

    autoSubmittedRef.current = true;
    setSubmitting(true);

    try {
      await saveCurrentAnswer();
      await submitExam(submission.id);
      setSubmitted(true);
      navigate('/student/results', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to auto-submit exam.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!submission || submitted) return;

    if (timer <= 0) {
      autoSubmit();
      return;
    }

    const interval = setInterval(() => {
      setTimer((count) => Math.max(0, count - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, submission, submitted]);

  useEffect(() => {
    if (!submission || !questions.length || submitted) return;

    const interval = setInterval(() => {
      saveCurrentAnswer(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [submission, questions, currentQuestion, answerData, submitted]);

  const formattedTimer = useMemo(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timer]);

  const savedAgo = useMemo(() => {
    if (!savedAt) return null;

    const diff = Math.floor((Date.now() - savedAt) / 1000);

    if (diff < 5) return 'Saved just now';
    return `Saved ${diff}s ago`;
  }, [savedAt, saving]);

  const progressPercent = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((currentQuestion + 1) / questions.length) * 100);
  }, [currentQuestion, questions.length]);

  const answeredCount = useMemo(() => {
    return questions.filter((question) => {
      const value = answerData[question.id];
      return value !== undefined && value !== null && String(value).trim() !== '';
    }).length;
  }, [questions, answerData]);

  const getQuestionOptions = (question) => {
    return question.options || question.questionOptions || [];
  };

  const isChoiceQuestion = (questionType) => {
    return questionType === 'MCQ' || questionType === 'TRUE_FALSE';
  };

  const updateAnswer = (questionId, value) => {
    setAnswerData((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setSaveStatus('');
  };

  const buildAnswerPayload = (question) => {
    const value = answerData[question.id] || '';

    if (isChoiceQuestion(question.questionType)) {
      return {
        questionId: question.id,
        answerText: '',
        selectedOptionId: value || null,
      };
    }

    return {
      questionId: question.id,
      answerText: value,
      selectedOptionId: null,
    };
  };

  const saveCurrentAnswer = async (showMessages = true) => {
    if (!submission || !questions.length || !current) return;

    const value = answerData[current.id];

    if (value === undefined || value === null || String(value).trim() === '') {
      return;
    }

    if (showMessages) {
      setSaveStatus('Saving...');
    }

    setSaving(true);

    try {
      const payload = buildAnswerPayload(current);
      await saveAnswer(submission.id, payload);

      setSavedAt(Date.now());

      if (showMessages) {
        setSaveStatus('Saved');
      }
    } catch (err) {
      setSaveStatus('Error saving');
      setError(err.response?.data?.message || 'Failed to save answer.');
    } finally {
      setSaving(false);
    }
  };

  const goToQuestion = async (index) => {
    await saveCurrentAnswer(false);
    setCurrentQuestion(index);
  };

  const goNext = async () => {
    await saveCurrentAnswer(false);
    setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1));
  };

  const goPrevious = async () => {
    await saveCurrentAnswer(false);
    setCurrentQuestion((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (!submission || submitted) return;

    const confirmed = window.confirm(
      'Are you sure you want to submit the exam? You will not be able to change your answers after submission.'
    );

    if (!confirmed) return;

    setSubmitting(true);
    setError('');

    try {
      await saveCurrentAnswer(false);
      await submitExam(submission.id);

      setSubmitted(true);
      navigate('/student/results', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam.');
    } finally {
      setSubmitting(false);
    }
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

  if (error) {
    return (
      <>
        <PageHeader
          title="Exam"
          subtitle="Unable to continue exam"
        />
        <Alert type="error">{error}</Alert>
      </>
    );
  }

  if (!submission || !questions.length || !current) {
    return (
      <>
        <PageHeader
          title="Exam in Progress"
          subtitle="Loading exam questions..."
        />
        <Card className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner />
        </Card>
      </>
    );
  }

  const timerDanger = timer <= 300;
  const currentOptions = getQuestionOptions(current);

  return (
    <>
      <PageHeader
        title={examDetails?.title || 'Exam in Progress'}
        subtitle={examDetails?.description || 'Answer all questions and submit before time ends'}
      />

      <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_280px]">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="info">
                  Question {currentQuestion + 1} of {questions.length}
                </Badge>

                <Badge variant={timerDanger ? 'danger' : 'success'}>
                  Time: {formattedTimer}
                </Badge>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Answered: {answeredCount}/{questions.length}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-slate-900">
                Exam session
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your answers are saved automatically every 10 seconds.
              </p>
            </div>

            <div
              className={`rounded-2xl px-5 py-4 text-center font-semibold shadow-sm ${
                timerDanger
                  ? 'bg-red-100 text-red-700'
                  : 'bg-white text-slate-900'
              }`}
            >
              <div className="text-xs uppercase tracking-wide">Time left</div>
              <div className="text-3xl font-bold">{formattedTimer}</div>
            </div>
          </div>

          <div className="mt-5 h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900">Save Status</h3>

          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            {saving ? 'Saving...' : saveStatus || savedAgo || 'Not saved yet'}
          </div>

          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full"
            onClick={() => saveCurrentAnswer(true)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Current Answer'}
          </Button>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="space-y-6">
          <Card>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge variant="info">{getTypeLabel(current.questionType)}</Badge>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {current.points || 0} points
              </span>
            </div>

            <h2 className="mb-6 text-xl font-semibold text-slate-900">
              {current.questionText}
            </h2>

            {isChoiceQuestion(current.questionType) ? (
              <div className="space-y-3">
                {currentOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition hover:bg-slate-50 ${
                      answerData[current.id] === option.id
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`answer-${current.id}`}
                      value={option.id}
                      checked={answerData[current.id] === option.id}
                      onChange={() => updateAnswer(current.id, option.id)}
                      className="h-4 w-4"
                    />

                    <span className="font-medium text-slate-800">
                      {option.optionText}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <Textarea
                value={answerData[current.id] || ''}
                onChange={(e) => updateAnswer(current.id, e.target.value)}
                placeholder="Write your answer here..."
                rows={current.questionType === 'ESSAY' ? 10 : 4}
              />
            )}
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="secondary"
              onClick={goPrevious}
              disabled={currentQuestion === 0 || submitting}
            >
              Previous
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={goNext}
              disabled={currentQuestion === questions.length - 1 || submitting}
            >
              Next
            </Button>

            <Button
              type="button"
              onClick={() => saveCurrentAnswer(true)}
              disabled={saving || submitting}
            >
              {saving ? 'Saving...' : 'Save Answer'}
            </Button>

            <Button
              type="button"
              variant="danger"
              onClick={handleSubmit}
              disabled={submitting || submitted}
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </Button>
          </div>
        </div>

        <Card>
          <h3 className="mb-4 font-semibold text-slate-900">
            Question Navigator
          </h3>

          <div className="grid grid-cols-5 gap-2 lg:grid-cols-3">
            {questions.map((question, index) => {
              const answered =
                answerData[question.id] !== undefined &&
                answerData[question.id] !== null &&
                String(answerData[question.id]).trim() !== '';

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => goToQuestion(index)}
                  className={`rounded-xl p-3 text-sm font-semibold transition ${
                    index === currentQuestion
                      ? 'bg-blue-600 text-white'
                      : answered
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-blue-600" />
              Current question
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-green-100" />
              Answered
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-slate-100" />
              Not answered
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default ExamStart;