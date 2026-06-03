import React from 'react';
import { useNotifyToasts } from '../context/ServicesContext.jsx';

export default function ToastViewport() {
  const { toasts, dismiss } = useNotifyToasts();

  if (toasts.length === 0) return null;

  return (
    <div
      className="position-fixed top-0 start-50 translate-middle-x p-3"
      style={{ zIndex: 1080, minWidth: '320px' }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className={`alert alert-${t.type} alert-dismissible shadow-sm mb-2`}
          role="alert"
        >
          {t.message}
          <button type="button" className="btn-close" onClick={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
