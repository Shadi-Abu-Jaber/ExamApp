import React from 'react';
import { EXAM_STATUS } from '../../models/Exam.js';

const LABEL = {
  [EXAM_STATUS.DRAFT]: 'טיוטה',
  [EXAM_STATUS.PUBLISHED]: 'מפורסם',
  [EXAM_STATUS.CLOSED]: 'סגור',
};

const STYLE = {
  [EXAM_STATUS.DRAFT]: 'bg-secondary',
  [EXAM_STATUS.PUBLISHED]: 'bg-success',
  [EXAM_STATUS.CLOSED]: 'bg-danger',
};

export default function ExamStatusBadge({ status }) {
  return (
    <span className={`badge ${STYLE[status] || 'bg-secondary'}`}>
      {LABEL[status] || status}
    </span>
  );
}
