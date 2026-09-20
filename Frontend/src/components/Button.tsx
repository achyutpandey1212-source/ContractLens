import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  to?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  to,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center text-sm font-medium rounded-lg px-4 py-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950',
    secondary: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-200',
    outline: 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50',
  };

  const combinedClass = `${baseStyles} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedClass}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClass} {...props}>
      {children}
    </button>
  );
};
