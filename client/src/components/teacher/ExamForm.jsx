import React, { useState } from 'react';
import { Question } from '../../models/Question.js';
import QuestionEditor from './QuestionEditor.jsx';

function emptyQuestion() {
  return new Question({ options: ['', '', '', ''], correctAnswer: 0 }).toJSON();
}

export default function ExamForm({ initial, submitLabel, onSubmit, onCancel, submitting }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [questions, setQuestions] = useState(
    initial?.questions?.length ? initial.questions : [emptyQuestion()]
  );
  const [error, setError] = useState('');

  const updateQuestion = (idx, q) => {
    const next = questions.slice();
    next[idx] = q;
    setQuestions(next);
  };

  const removeQuestion = (idx) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const addQuestion = () => {
    setQuestions([...questions, emptyQuestion()]);
  };

  const validateAndSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('יש להזין כותרת לבחינה');
      return;
    }
    for (let i = 0; i < questions.length; i += 1) {
      const q = Question.from(questions[i]);
      if (!q.isValid()) {
        setError(`שאלה ${i + 1} אינה תקינה — בדוק טקסט, אפשרויות, ותשובה נכונה`);
        return;
      }
    }
    onSubmit({ title: title.trim(), description: description.trim(), questions });
  };

  return (
    <form onSubmit={validateAndSubmit} dir="rtl">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-4">
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label fw-semibold">כותרת הבחינה</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-0">
            <label className="form-label fw-semibold">תיאור (אופציונלי)</label>
            <textarea
              className="form-control"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">שאלות ({questions.length})</h5>
        <button type="button" className="btn btn-primary btn-sm" onClick={addQuestion}>
          + הוסף שאלה
        </button>
      </div>

      {questions.map((q, idx) => (
        <QuestionEditor
          key={q.id || idx}
          index={idx}
          question={q}
          onChange={(next) => updateQuestion(idx, next)}
          onRemove={() => removeQuestion(idx)}
        />
      ))}

      <div className="d-flex gap-2 mt-4">
        <button type="submit" className="btn btn-success" disabled={submitting}>
          {submitting ? 'שומר...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
            ביטול
          </button>
        )}
      </div>
    </form>
  );
}
