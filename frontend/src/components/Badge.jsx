import React from 'react';

const VARIANTS = {
  default: 'bg-slate-100 text-slate-800',
  info: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',

  // Status values
  DRAFT: 'bg-slate-100 text-slate-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-orange-100 text-orange-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  GRADED: 'bg-green-100 text-green-800',

  // Role values
  ADMIN: 'bg-red-100 text-red-800',
  LECTURER: 'bg-blue-100 text-blue-800',
  STUDENT: 'bg-green-100 text-green-800',
};

export default function Badge({
  children,
  variant,
  type,
  className = '',
}) {
  const key = variant || type || 'default';
  const classes = VARIANTS[key] || VARIANTS.default;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${classes} ${className}`}
    >
      {children}
    </span>
  );
}