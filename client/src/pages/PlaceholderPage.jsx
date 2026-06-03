import React from 'react';

export default function PlaceholderPage({ title, note }) {
  return (
    <div className="container py-5" dir="rtl">
      <div className="alert alert-secondary text-center">
        <h4 className="mb-2">{title}</h4>
        <p className="mb-0 text-muted">{note || 'בקרוב במודול הבא.'}</p>
      </div>
    </div>
  );
}
