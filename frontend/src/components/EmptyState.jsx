import React from 'react';

export default function EmptyState({ title = 'Nothing here', description, action }) {
  return (
    <div className="rounded-xl bg-white p-8 shadow text-center">
      <div className="text-lg font-semibold text-slate-700">{title}</div>
      {description && <div className="mt-2 text-sm text-slate-500">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
