// עורך שאלה בודדת — טקסט שאלה, אפשרויות, וסימון התשובה הנכונה.
// מגביל ל-2..6 אפשרויות. עדכון התשובה הנכונה מתעדכן אוטומטית
// כאשר אפשרות שלפניה נמחקת.

import React from 'react';

export default function QuestionEditor({ index, question, onChange, onRemove }) {
  const updateOption = (optIdx, value) => {
    const options = question.options.slice();
    options[optIdx] = value;
    onChange({ ...question, options });
  };

  const addOption = () => {
    if (question.options.length >= 6) return;
    onChange({ ...question, options: [...question.options, ''] });
  };

  const removeOption = (optIdx) => {
    if (question.options.length <= 2) return;
    const options = question.options.filter((_, i) => i !== optIdx);
    const correctAnswer = question.correctAnswer === optIdx
      ? 0
      : question.correctAnswer > optIdx
        ? question.correctAnswer - 1
        : question.correctAnswer;
    onChange({ ...question, options, correctAnswer });
  };

  return (
    <div className="card mb-3 border-primary-subtle">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="mb-0">שאלה {index + 1}</h6>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={onRemove}>
            הסר
          </button>
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold">טקסט השאלה</label>
          <input
            type="text"
            className="form-control"
            value={question.text}
            onChange={(e) => onChange({ ...question, text: e.target.value })}
            placeholder="נסח שאלה..."
          />
        </div>

        <label className="form-label small fw-semibold">אפשרויות (סמן את הנכונה)</label>
        {question.options.map((opt, optIdx) => (
          <div key={optIdx} className="input-group mb-2">
            <span className="input-group-text">
              <input
                type="radio"
                name={`q-${question.id}-correct`}
                checked={question.correctAnswer === optIdx}
                onChange={() => onChange({ ...question, correctAnswer: optIdx })}
              />
            </span>
            <input
              type="text"
              className="form-control"
              value={opt}
              onChange={(e) => updateOption(optIdx, e.target.value)}
              placeholder={`אפשרות ${optIdx + 1}`}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => removeOption(optIdx)}
              disabled={question.options.length <= 2}
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={addOption}
          disabled={question.options.length >= 6}
        >
          + הוסף אפשרות
        </button>
      </div>
    </div>
  );
}
