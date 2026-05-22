import React from 'react';

export default function Alert({ type = 'info', children }) {
  const cls = {
    info: 'bg-blue-50 text-blue-700',
    success: 'bg-green-50 text-green-700',
    error: 'bg-red-50 text-red-700',
    warn: 'bg-yellow-50 text-yellow-700',
  }[type];
  return <div className={`rounded-md p-3 ${cls}`}>{children}</div>;
}
