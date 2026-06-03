// עמוד יצירת בחינה חדשה.
// בחינות חדשות נשמרות תמיד כטיוטה — הפרסום הוא פעולה נפרדת בעמוד העריכה.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '../../context/ServicesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import ExamForm from '../../components/teacher/ExamForm.jsx';

export default function ExamBuilderPage() {
  const { examService, notify } = useServices();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (payload) => {
    setSubmitting(true);
    try {
      const exam = await examService.create({ ...payload, createdBy: user.id });
      notify.success('הבחינה נשמרה כטיוטה');
      navigate(`/teacher/exams/${exam.id}/edit`);
    } catch (err) {
      notify.error(err?.message || 'שגיאה ביצירת הבחינה');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4" dir="rtl">
      <h2 className="mb-4">בחינה חדשה</h2>
      <ExamForm
        submitLabel="צור בחינה"
        onSubmit={handleCreate}
        onCancel={() => navigate('/teacher/exams')}
        submitting={submitting}
      />
    </div>
  );
}
