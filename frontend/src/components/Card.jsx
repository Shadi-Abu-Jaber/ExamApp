import React from 'react';

export default function Card({ children, className = '' }) {
  return <div className={`rounded-xl bg-white p-6 shadow ${className}`}>{children}</div>;
}
