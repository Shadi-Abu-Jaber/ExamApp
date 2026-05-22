import React from 'react';

const VARIANTS = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-slate-700 text-white hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 shadow-none',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-xl font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${SIZES[size] || SIZES.md} ${
        VARIANTS[variant] || VARIANTS.primary
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}