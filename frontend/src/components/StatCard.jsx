import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  className = '',
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-500">{title}</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>

          {subtitle && (
            <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
          )}
        </div>

        {icon && <div className="text-3xl text-slate-300">{icon}</div>}
      </div>
    </div>
  );
}