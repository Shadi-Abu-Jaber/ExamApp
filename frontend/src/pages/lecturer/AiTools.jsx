import { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  Check,
  Copy,
  FilePlus2,
  FileQuestion,
  Lightbulb,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';

import { createExam, fetchExams } from '../../api/exams';
import { createQuestion } from '../../api/questions';

import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import Badge from '../../components/Badge';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const STORAGE_KEY = 'examflow_ai_tools_state';

const getInitialState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const AiTools = () => {
  const savedState = getInitialState();

  const [topic, setTopic] = useState(savedState?.topic || '');
  const [difficulty, setDifficulty] = useState(savedState?.difficulty || 'Medium');
  const [questionCount, setQuestionCount] = useState(savedState?.questionCount || 5);
  const [questionType, setQuestionType] = useState(savedState?.questionType || 'Mixed');

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(savedState?.selectedExamId || '');
  const [loadingExams, setLoadingExams] = useState(true);

  const [generatedQuestions, setGeneratedQuestions] = useState(
    savedState?.generatedQuestions || []
  );
  const [selectedQuestionIds, setSelectedQuestionIds] = useState(
    savedState?.selectedQuestionIds || []
  );

  const [answerText, setAnswerText] = useState(savedState?.answerText || '');
  const [feedback, setFeedback] = useState(savedState?.feedback || '');

  const [studyTopic, setStudyTopic] = useState(savedState?.studyTopic || '');
  const [studyPlan, setStudyPlan] = useState(savedState?.studyPlan || []);

  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [adding, setAdding] = useState(false);
  const [creatingExam, setCreatingExam] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        topic,
        difficulty,
        questionCount,
        questionType,
        selectedExamId,
        generatedQuestions,
        selectedQuestionIds,
        answerText,
        feedback,
        studyTopic,
        studyPlan,
      })
    );
  }, [
    topic,
    difficulty,
    questionCount,
    questionType,
    selectedExamId,
    generatedQuestions,
    selectedQuestionIds,
    answerText,
    feedback,
    studyTopic,
    studyPlan,
  ]);

  const loadExams = async () => {
    setLoadingExams(true);
    setMessage('');

    try {
      const res = await fetchExams();

      const draftExams = (res.data || []).filter(
        (exam) => exam.status === 'DRAFT'
      );

      setExams(draftExams);

      if (draftExams.length) {
        const selectedStillExists = draftExams.some(
          (exam) => exam.id === selectedExamId
        );

        if (!selectedExamId || !selectedStillExists) {
          setSelectedExamId(draftExams[0].id);
        }
      } else {
        setSelectedExamId('');
      }
    } catch (err) {
      setExams([]);
      setMessage(err.response?.data?.message || 'Unable to load draft exams.');
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const selectedExam = useMemo(() => {
    return exams.find((exam) => exam.id === selectedExamId);
  }, [exams, selectedExamId]);

  const aiStats = useMemo(() => {
    return [
      {
        label: 'Generated Questions',
        value: generatedQuestions.length,
        description: 'AI drafts stored locally',
      },
      {
        label: 'Selected Questions',
        value: selectedQuestionIds.length,
        description: 'Ready to insert into exam',
      },
      {
        label: 'Target Draft Exam',
        value: selectedExam ? 'Selected' : 'None',
        description: selectedExam?.title || 'Create or select a draft exam',
      },
    ];
  }, [generatedQuestions.length, selectedQuestionIds.length, selectedExam]);

  const getQuestionTypeForIndex = (index) => {
    if (questionType !== 'Mixed') return questionType;

    const types = ['MCQ', 'TRUE_FALSE', 'SHORT_TEXT', 'ESSAY'];
    return types[index % types.length];
  };

  const getQuestionTemplate = (type, number) => {
    const cleanTopic = topic.trim();

    if (type === 'MCQ') {
      return {
        type: 'MCQ',
        title: `Which statement best describes ${cleanTopic} concept ${number}?`,
        options: [
          {
            text: `The correct principle related to ${cleanTopic}`,
            isCorrect: true,
          },
          {
            text: `A common misconception about ${cleanTopic}`,
            isCorrect: false,
          },
          {
            text: 'An unrelated definition from another topic',
            isCorrect: false,
          },
          {
            text: 'A partially correct but incomplete answer',
            isCorrect: false,
          },
        ],
        explanation: `This question checks whether the student understands the core definition of ${cleanTopic}.`,
        points: difficulty === 'Hard' ? 8 : difficulty === 'Easy' ? 4 : 5,
      };
    }

    if (type === 'TRUE_FALSE') {
      const correctIsTrue = number % 2 !== 0;

      return {
        type: 'TRUE_FALSE',
        title: `${cleanTopic} statement ${number}: every operation has the same time complexity in all cases.`,
        options: [
          { text: 'True', isCorrect: correctIsTrue },
          { text: 'False', isCorrect: !correctIsTrue },
        ],
        explanation: `This question tests whether students can identify precise statements about ${cleanTopic}.`,
        points: 3,
      };
    }

    if (type === 'SHORT_TEXT') {
      return {
        type: 'SHORT_TEXT',
        title: `Briefly define ${cleanTopic} and mention one practical use case.`,
        options: [],
        explanation: 'Expected answer should include a clear definition and one example.',
        points: difficulty === 'Hard' ? 8 : 5,
      };
    }

    return {
      type: 'ESSAY',
      title: `Explain ${cleanTopic} in detail, including advantages, limitations, and an example.`,
      options: [],
      explanation: 'Manual grading required. Good answers should include structure, examples, and reasoning.',
      points: difficulty === 'Hard' ? 15 : 10,
    };
  };

  const generateQuestions = () => {
    setMessage('');
    setSuccess('');

    if (!topic.trim()) {
      setMessage('Please enter a topic before generating questions.');
      return;
    }

    const count = Math.max(1, Math.min(20, Number(questionCount || 1)));

    const generated = Array.from({ length: count }, (_, index) => {
      const number = index + 1;
      const type = getQuestionTypeForIndex(index);
      const template = getQuestionTemplate(type, number);

      return {
        id: `ai-${Date.now()}-${index}`,
        questionText: template.title,
        questionType: template.type,
        points: template.points,
        orderIndex: index + 1,
        options: template.options,
        explanation: template.explanation,
        difficulty,
        qualityScore:
          difficulty === 'Hard'
            ? 94 - (index % 5)
            : difficulty === 'Easy'
              ? 86 + (index % 6)
              : 90 + (index % 5),
        bloomLevel:
          template.type === 'ESSAY'
            ? 'Analyze'
            : template.type === 'SHORT_TEXT'
              ? 'Understand'
              : 'Remember / Apply',
      };
    });

    setGeneratedQuestions(generated);
    setSelectedQuestionIds(generated.map((question) => question.id));
    setSuccess(`${generated.length} AI questions generated successfully and saved locally.`);
  };

  const createDraftExamFromAI = async () => {
    setMessage('');
    setSuccess('');

    if (!topic.trim()) {
      setMessage('Enter a topic first so I can create a draft exam title.');
      return;
    }

    setCreatingExam(true);

    try {
      const now = new Date();
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const payload = {
        title: `AI Generated Exam - ${topic.trim()}`,
        description: `Draft exam generated from AI Tools for topic: ${topic.trim()}.`,
        durationMinutes: 30,
        startTime: now.toISOString(),
        endTime: end.toISOString(),
      };

      const res = await createExam(payload);
      await loadExams();

      if (res.data?.id) {
        setSelectedExamId(res.data.id);
      }

      setSuccess('Draft exam created successfully. You can now add selected AI questions to it.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to create draft exam.');
    } finally {
      setCreatingExam(false);
    }
  };

  const toggleQuestion = (questionId) => {
    setSelectedQuestionIds((prev) => {
      if (prev.includes(questionId)) {
        return prev.filter((id) => id !== questionId);
      }

      return [...prev, questionId];
    });
  };

  const selectAll = () => {
    setSelectedQuestionIds(generatedQuestions.map((question) => question.id));
  };

  const clearSelection = () => {
    setSelectedQuestionIds([]);
  };

  const clearAIWorkspace = () => {
    if (!window.confirm('Clear generated questions and AI workspace?')) return;

    localStorage.removeItem(STORAGE_KEY);
    setGeneratedQuestions([]);
    setSelectedQuestionIds([]);
    setFeedback('');
    setStudyPlan([]);
    setSuccess('AI workspace cleared.');
  };

  const mapAiQuestionToBackendPayload = (question, orderIndex) => {
    return {
      questionText: question.questionText,
      questionType: question.questionType,
      points: Number(question.points || 5),
      orderIndex,
      options:
        question.questionType === 'MCQ' ||
        question.questionType === 'TRUE_FALSE'
          ? question.options.map((option) => ({
              optionText: option.text,
              isCorrect: option.isCorrect,
            }))
          : [],
    };
  };

  const addSelectedToExam = async () => {
    setMessage('');
    setSuccess('');

    if (!selectedExamId) {
      setMessage('Please select or create a draft exam first.');
      return;
    }

    const selectedQuestions = generatedQuestions.filter((question) =>
      selectedQuestionIds.includes(question.id)
    );

    if (!selectedQuestions.length) {
      setMessage('Please select at least one generated question.');
      return;
    }

    setAdding(true);

    try {
      for (let i = 0; i < selectedQuestions.length; i += 1) {
        const payload = mapAiQuestionToBackendPayload(
          selectedQuestions[i],
          i + 1
        );

        await createQuestion(selectedExamId, payload);
      }

      setSuccess(
        `${selectedQuestions.length} AI questions added to "${selectedExam?.title || 'exam'}" successfully.`
      );

      setGeneratedQuestions([]);
      setSelectedQuestionIds([]);
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          'Unable to add AI questions to the selected exam.'
      );
    } finally {
      setAdding(false);
    }
  };

  const copyQuestions = async () => {
    setMessage('');
    setSuccess('');

    if (!generatedQuestions.length) {
      setMessage('Generate questions before copying.');
      return;
    }

    const text = generatedQuestions
      .map((question, index) => {
        const options = question.options.length
          ? question.options
              .map(
                (option, optionIndex) =>
                  `   ${optionIndex + 1}. ${option.text}${option.isCorrect ? ' ✅' : ''}`
              )
              .join('\n')
          : '   Manual answer question';

        return `Q${index + 1}. [${question.questionType}] ${question.questionText}\nPoints: ${question.points}\nBloom: ${question.bloomLevel}\nOptions:\n${options}\nExplanation: ${question.explanation}`;
      })
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Generated questions copied to clipboard.');
    } catch {
      setMessage('Unable to copy. Your browser may block clipboard access.');
    }
  };

  const generateFeedback = () => {
    setMessage('');
    setSuccess('');

    if (!answerText.trim()) {
      setMessage('Paste a student answer before generating feedback.');
      return;
    }

    const wordCount = answerText.trim().split(/\s+/).length;

    setFeedback(
      `AI Feedback Draft:\n\nThe answer demonstrates ${
        wordCount > 40 ? 'a developed' : 'a basic'
      } understanding of the topic.\n\nStrengths:\n- The student attempts to address the main idea.\n- The answer includes relevant terminology.\n\nNeeds improvement:\n- Add clearer definitions.\n- Explain reasoning step by step.\n- Include a concrete example.\n\nSuggested lecturer note:\nFocus grading on correctness, completeness, and clarity.`
    );
  };

  const generateStudyPlan = () => {
    setMessage('');
    setSuccess('');

    if (!studyTopic.trim()) {
      setMessage('Enter a topic to generate a study recommendation.');
      return;
    }

    setStudyPlan([
      {
        day: 'Day 1',
        title: `Review core concepts of ${studyTopic}`,
        task: 'Summarize definitions, formulas, and the main rules.',
      },
      {
        day: 'Day 2',
        title: 'Practice exam-style questions',
        task: 'Solve at least 10 questions and mark every mistake.',
      },
      {
        day: 'Day 3',
        title: 'Fix weak points',
        task: 'Re-study incorrect questions and write a short explanation for each.',
      },
    ]);
  };

  const getTypeVariant = (type) => {
    if (type === 'MCQ') return 'info';
    if (type === 'TRUE_FALSE') return 'success';
    if (type === 'ESSAY') return 'warning';
    return 'default';
  };

  return (
    <>
      <div className="mb-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-blue-950 to-slate-950 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-blue-100 ring-1 ring-white/15">
              <Sparkles className="h-4 w-4" />
              ExamFlow AI Studio
            </div>

            <h1 className="text-4xl font-black tracking-tight">
              Generate, store, and insert AI questions into real exams
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100">
              Your generated questions are saved locally, so navigating away
              will not reset the AI workspace.
            </p>
          </div>

          <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
            <Brain className="h-12 w-12 text-blue-200" />
            <div className="mt-3 text-sm font-semibold text-blue-100">
              AI Workflow Active
            </div>
          </div>
        </div>
      </div>

      <PageHeader
        title="AI Tools"
        subtitle="Generate exam content, feedback, and personalized recommendations"
      />

      {message && (
        <div className="mb-4">
          <Alert type="error">{message}</Alert>
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Alert type="success">{success}</Alert>
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {aiStats.map((item) => (
          <Card key={item.label}>
            <p className="text-sm font-semibold text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {item.value}
            </p>
            <p className="mt-1 text-sm text-slate-500">{item.description}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <FileQuestion className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                AI Question Generator
              </h2>
              <p className="text-sm text-slate-500">
                Generate structured drafts and add them directly to a real exam.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Example: Binary Search Trees"
            />

            <Input
              label="Number of questions"
              type="number"
              min="1"
              max="20"
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value)}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Difficulty
              </label>

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Question type
              </label>

              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option>Mixed</option>
                <option>MCQ</option>
                <option>TRUE_FALSE</option>
                <option>SHORT_TEXT</option>
                <option>ESSAY</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-slate-700">
                  Target draft exam
                </label>

                <Button type="button" size="sm" variant="ghost" onClick={loadExams}>
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {loadingExams ? (
                <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <LoadingSpinner />
                </div>
              ) : exams.length ? (
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No draft exams found. You can create a draft exam directly
                  from this AI page.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={generateQuestions}>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Questions
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={createDraftExamFromAI}
              disabled={creatingExam}
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              {creatingExam ? 'Creating...' : 'Create Draft Exam'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={copyQuestions}
              disabled={!generatedQuestions.length}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={addSelectedToExam}
              disabled={
                adding ||
                !selectedExamId ||
                !selectedQuestionIds.length ||
                !generatedQuestions.length
              }
            >
              <Check className="mr-2 h-4 w-4" />
              {adding ? 'Adding...' : 'Add Selected to Exam'}
            </Button>

            <Button
              type="button"
              variant="danger"
              onClick={clearAIWorkspace}
              disabled={!generatedQuestions.length && !feedback && !studyPlan.length}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-purple-50 p-3 text-purple-700">
              <MessageSquareText className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                AI Feedback Assistant
              </h2>
              <p className="text-sm text-slate-500">
                Draft feedback for essay or short-text answers.
              </p>
            </div>
          </div>

          <Textarea
            label="Student answer"
            rows={6}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Paste a student answer here..."
          />

          <Button
            className="mt-4"
            variant="secondary"
            onClick={generateFeedback}
          >
            Generate Feedback
          </Button>

          {feedback && (
            <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-purple-50 p-4 text-sm text-purple-900">
              {feedback}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-green-50 p-3 text-green-700">
              <Lightbulb className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-950">
                AI Study Recommendation
              </h2>
              <p className="text-sm text-slate-500">
                Generate a simple improvement plan for students.
              </p>
            </div>
          </div>

          <Input
            label="Weak topic"
            value={studyTopic}
            onChange={(e) => setStudyTopic(e.target.value)}
            placeholder="Example: Graph Traversal"
          />

          <Button
            className="mt-4"
            variant="secondary"
            onClick={generateStudyPlan}
          >
            Generate Study Plan
          </Button>

          {studyPlan.length > 0 && (
            <div className="mt-5 space-y-3">
              {studyPlan.map((item) => (
                <div
                  key={item.day}
                  className="rounded-2xl border border-green-100 bg-green-50 p-4"
                >
                  <Badge variant="success">{item.day}</Badge>

                  <h3 className="mt-3 font-bold text-green-950">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-sm text-green-800">{item.task}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Generated Questions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review, select, and add AI-generated drafts to your exam.
              </p>
            </div>

            {generatedQuestions.length > 0 && (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={selectAll}>
                  Select All
                </Button>

                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          {generatedQuestions.length ? (
            <div className="space-y-3">
              {generatedQuestions.map((question, index) => {
                const selected = selectedQuestionIds.includes(question.id);

                return (
                  <div
                    key={question.id}
                    className={`rounded-2xl border p-4 transition ${
                      selected
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleQuestion(question.id)}
                        className="h-4 w-4"
                      />

                      <Badge variant="info">Q{index + 1}</Badge>

                      <Badge variant={getTypeVariant(question.questionType)}>
                        {question.questionType}
                      </Badge>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {question.points} pts
                      </span>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        Quality {question.qualityScore}%
                      </span>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {question.bloomLevel}
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-950">
                      {question.questionText}
                    </h3>

                    {question.options.length > 0 && (
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {question.options.map((option) => (
                          <li
                            key={option.text}
                            className={`rounded-xl px-3 py-2 ${
                              option.isCorrect
                                ? 'bg-green-100 text-green-800'
                                : 'bg-white text-slate-600'
                            }`}
                          >
                            {option.text}
                            {option.isCorrect ? '  ✓' : ''}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-600">
                      <strong>AI explanation:</strong> {question.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No generated questions yet"
              description="Enter a topic, choose settings, and generate AI questions."
            />
          )}
        </Card>
      </div>
    </>
  );
};

export default AiTools;