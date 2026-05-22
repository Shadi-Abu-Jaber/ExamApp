import React from 'react';

export default function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        {title && <div className="text-lg font-semibold mb-4">{title}</div>}
        {children}
        <div className="mt-4 text-right">
          <button onClick={onClose} className="text-sm text-slate-600">Close</button>
        </div>
      </div>
    </div>
  );
}
